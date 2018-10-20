import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import * as HttpStatus from "http-status";
import { Connection } from "typeorm";

import { DataController, handle } from "../controllers";
import { ProfessionPricelist } from "../entities";
import { ItemId } from "../lib/auction";
import { code, Messenger } from "../lib/messenger";
import { IUnmetDemandRequestBody } from "../lib/price-list";

export const getRouter = (dbConn: Connection, messenger: Messenger) => {
    const router = Router();
    const controller = new DataController(messenger);

    router.get(
        "/regions",
        wrap(async (req, res) => {
            await handle(controller.getRegions, req, res);
        }),
    );
    router.get(
        "/item-classes",
        wrap(async (req, res) => {
            await handle(controller.getItemClasses, req, res);
        }),
    );
    router.get(
        "/boot",
        wrap(async (req, res) => {
            await handle(controller.getBoot, req, res);
        }),
    );
    router.get(
        "/region/:regionName/realms",
        wrap(async (req, res) => {
            await handle(controller.getRealms, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/auctions",
        wrap(async (req, res) => {
            await handle(controller.getAuctions, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/owners",
        wrap(async (req, res) => {
            await handle(controller.getOwners, req, res);
        }),
    );
    router.post(
        "/items",
        wrap(async (req, res) => {
            await handle(controller.queryItems, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/query-auctions",
        wrap(async (req, res) => {
            await handle(controller.queryAuctions, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/query-owner-items",
        wrap(async (req, res) => {
            await handle(controller.queryOwnerItems, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/price-list",
        wrap(async (req, res) => {
            await handle(controller.getPricelist, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/price-list-history",
        wrap(async (req, res) => {
            await handle(controller.getPricelistHistories, req, res);
        }),
    );
    router.post(
        "/region/:regionName/realm/:realmSlug/unmet-demand",
        wrap(async (req, res) => {
            // gathering profession-pricelists
            const { expansion } = req.body as IUnmetDemandRequestBody;
            const professionPricelists = await dbConn.getRepository(ProfessionPricelist).find({
                where: { expansion },
            });

            // gathering included item-ids
            const itemIds = professionPricelists.reduce((previousValue: ItemId[], v: ProfessionPricelist) => {
                const pricelistItemIds = v.pricelist.entries.map(entry => entry.itemId);
                for (const itemId of pricelistItemIds) {
                    if (previousValue.indexOf(itemId) === -1) {
                        previousValue.push(itemId);
                    }
                }

                return previousValue;
            }, []);

            // gathering items
            const itemsMsg = await messenger.getItems(itemIds);
            if (itemsMsg.code !== code.ok) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: itemsMsg.error });

                return;
            }
            const items = itemsMsg.data!.items;

            // gathering pricing data
            const msg = await messenger.getPriceList({
                item_ids: itemIds,
                realm_slug: req.params["realmSlug"],
                region_name: req.params["regionName"],
            });
            if (msg.code !== code.ok) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: msg.error });

                return;
            }
            const msgData = msg.data!;

            // gathering unmet items
            const unmetItemIds = itemIds.filter(v => !(v.toString() in msgData.price_list));

            // filtering in unmet profession-pricelists
            const unmetProfessionPricelists = professionPricelists.filter(v => {
                const unmetPricelistItemIds = v.pricelist.entries
                    .map(entry => entry.itemId)
                    .filter(itemId => unmetItemIds.indexOf(itemId) > -1);

                return unmetPricelistItemIds.length > 0;
            });

            res.json({
                items,
                professionPricelists: unmetProfessionPricelists,
                unmetItemIds,
            });
        }),
    );
    router.get(
        "/profession-pricelists/:profession_name",
        wrap(async (req: Request, res: Response) => {
            // gathering pricelists associated with this user, region, and realm
            const professionPricelists = await dbConn.getRepository(ProfessionPricelist).find({
                where: { name: req.param["profession_name"] },
            });

            // gathering related items
            const itemIds: ItemId[] = professionPricelists.reduce((pricelistItemIds: ItemId[], professionPricelist) => {
                return professionPricelist.pricelist.entries.reduce((entryItemIds: ItemId[], entry) => {
                    if (entryItemIds.indexOf(entry.itemId) === -1) {
                        entryItemIds.push(entry.itemId);
                    }

                    return entryItemIds;
                }, pricelistItemIds);
            }, []);
            const items = (await messenger.getItems(itemIds)).data!.items;

            // dumping out a response
            res.json({ profession_pricelists: professionPricelists, items });
        }),
    );

    return router;
};
