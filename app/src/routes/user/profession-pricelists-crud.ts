import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { Pricelist, PricelistEntry, ProfessionPricelist, User } from "../../entities";
import { UserLevel } from "../../entities/user";
import { ExpansionName } from "../../lib/expansion";
import { ProfessionName } from "../../lib/profession";
import { auth } from "../../lib/session";
import { ProfessionPricelistRequestBodyRules } from "../../lib/validator-rules";

interface IProfessionPricelistRequestBody {
    pricelist: {
        name: string;
    };
    entries: Array<{
        id?: number;
        item_id: number;
        quantity_modifier: number;
    }>;
    profession_name: ProfessionName;
    expansion_name: ExpansionName;
}

export const getRouter = (dbConn: Connection) => {
    const router = Router();

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as User;
            if (user.level !== UserLevel.Admin) {
                res.status(HTTPStatus.UNAUTHORIZED).json({ unauthorized: "You are not authorized to do that." });

                return;
            }

            let result: IProfessionPricelistRequestBody | null = null;
            try {
                result = (await ProfessionPricelistRequestBodyRules.validate(
                    req.body,
                )) as IProfessionPricelistRequestBody;
            } catch (err) {
                res.status(HTTPStatus.BAD_REQUEST).json({ [err.path]: err.message });

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
            const professionPricelist = new ProfessionPricelist();
            professionPricelist.pricelist = pricelist;
            professionPricelist.name = result.profession_name;
            professionPricelist.expansion = result.expansion_name;
            await dbConn.manager.save(professionPricelist);

            res.status(HTTPStatus.CREATED).json({
                entries,
                pricelist,
                profession_pricelist: professionPricelist,
            });
        }),
    );

    router.delete(
        "/:id",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as User;
            if (user.level !== UserLevel.Admin) {
                res.status(HTTPStatus.UNAUTHORIZED).json({ unauthorized: "You are not authorized to do that." });

                return;
            }

            const professionPricelist = await dbConn.getRepository(ProfessionPricelist).findOne({
                where: { id: req.params["id"] },
            });
            if (typeof professionPricelist === "undefined") {
                res.status(HTTPStatus.NOT_FOUND).json({});

                return;
            }

            if (professionPricelist.pricelist.user.id !== user.id) {
                res.status(HTTPStatus.UNAUTHORIZED).json({});

                return;
            }

            await Promise.all(professionPricelist.pricelist.entries.map(v => dbConn.manager.remove(v)));
            await dbConn.manager.remove(professionPricelist);
            await dbConn.manager.remove(professionPricelist.pricelist);
            res.json({});
        }),
    );

    return router;
};
