import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Pricelist, PricelistEntry, User } from "../../entities";
import { ItemId } from "../../lib/auction";
import { Messenger } from "../../lib/messenger";
import { auth } from "../../lib/session";
import { PricelistRequestBodyRules } from "../../lib/validator-rules";

interface IPricelistRequestBody {
    pricelist: {
        name: string;
    };
    entries: Array<{
        id?: number;
        item_id: number;
        quantity_modifier: number;
    }>;
}

export const getRouter = (dbConn: Connection, messenger: Messenger) => {
    const router = Router();

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as User;
            let result: IPricelistRequestBody | null = null;
            try {
                result = (await PricelistRequestBodyRules.validate(req.body)) as IPricelistRequestBody;
            } catch (err) {
                res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

                return;
            }

            const pricelist = new Pricelist();
            pricelist.user = user;
            pricelist.name = result.pricelist.name;
            await dbConn.manager.save(pricelist);
            const entries = await Promise.all(
                result.entries.map(v => {
                    const entry = new PricelistEntry();
                    entry.pricelist = pricelist;
                    entry.itemId = v.item_id;
                    entry.quantityModifier = v.quantity_modifier;

                    return dbConn.manager.save(entry);
                }),
            );
            res.status(HTTPStatus.CREATED).json({
                entries,
                pricelist,
            });
        }),
    );

    router.get(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as User;

            // gathering pricelists associated with this user
            let pricelists = await dbConn.getRepository(Pricelist).find({
                where: { user_id: user.id },
            });

            // filtering out profession-pricelists
            pricelists = pricelists.filter(v => typeof v.professionPricelist === "undefined");

            // gathering related items
            const itemIds: ItemId[] = pricelists.reduce((pricelistsItemIds: ItemId[], pricelist) => {
                return pricelist.entries.reduce((entriesItemIds: ItemId[], entry) => {
                    if (entriesItemIds.indexOf(entry.itemId) === -1) {
                        entriesItemIds.push(entry.itemId);
                    }

                    return entriesItemIds;
                }, pricelistsItemIds);
            }, []);
            const items = (await messenger.getItems(itemIds)).data!.items;

            // dumping out a response
            res.json({ pricelists, items });
        }),
    );

    router.get(
        "/:id",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as User;
            const pricelist = await dbConn.manager.getRepository(Pricelist).findOne({
                where: { id: req.params["id"], user_id: user.id },
            });
            if (typeof pricelist === "undefined") {
                res.status(HTTPStatus.NOT_FOUND);

                return;
            }

            res.json({ pricelist });
        }),
    );

    router.put(
        "/:id",
        auth,
        wrap(async (req: Request, res: Response) => {
            // resolving the pricelist
            const user = req.user as User;
            const pricelist = await dbConn.getRepository(Pricelist).findOne({
                where: { id: req.params["id"], user_id: user.id },
            });
            if (typeof pricelist === "undefined") {
                res.status(HTTPStatus.NOT_FOUND);

                return;
            }

            // validating the request body
            let result: IPricelistRequestBody | null = null;
            try {
                result = (await PricelistRequestBodyRules.validate(req.body)) as IPricelistRequestBody;
            } catch (err) {
                res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

                return;
            }

            // saving the pricelist
            pricelist.name = result.pricelist.name;
            await dbConn.manager.save(pricelist);

            // misc
            const entries = pricelist.entries;

            // creating new entries
            const newRequestEntries = result.entries.filter(v => !!v.id === false);
            const newEntries = await Promise.all(
                newRequestEntries.map(v => {
                    const entry = new PricelistEntry();
                    entry.pricelist = pricelist;
                    entry.itemId = v.item_id;
                    entry.quantityModifier = v.quantity_modifier;

                    return dbConn.manager.save(entry);
                }),
            );

            // updating existing entries
            const receivedRequestEntries = result.entries.filter(v => typeof v.id !== "undefined");
            let receivedEntries = await dbConn.getRepository(PricelistEntry).find({
                where: { id: receivedRequestEntries.map(v => v.id) },
            });
            receivedEntries = await Promise.all(
                receivedEntries.map((v, i) => {
                    v.itemId = receivedRequestEntries[i].id!;
                    v.quantityModifier = receivedEntries[i].quantityModifier;

                    return dbConn.manager.save(v);
                }),
            );

            // gathering removed entries and deleting them
            const receivedEntryIds = receivedEntries.map(v => v.id);
            const removedEntries = entries.filter(v => receivedEntryIds.indexOf(v.id) === -1);
            await Promise.all(removedEntries.map(v => dbConn.manager.remove(v)));

            // dumping out a response
            res.json({
                entries: [...receivedEntries, ...newEntries],
                pricelist,
            });
        }),
    );

    router.delete(
        "/:id",
        auth,
        wrap(async (req: Request, res: Response) => {
            // resolving the pricelist
            const user = req.user as User;
            const pricelist = await dbConn.getRepository(Pricelist).findOne({
                where: { id: req.params["id"], user_id: user.id },
            });
            if (typeof pricelist === "undefined") {
                res.status(HTTPStatus.NOT_FOUND);

                return;
            }

            await Promise.all(pricelist.entries.map(v => dbConn.manager.remove(v)));
            await dbConn.manager.remove(pricelist);
            res.json({});
        }),
    );

    return router;
};
