import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";

import { ExpansionName } from "../../lib/expansion";
import { ProfessionName } from "../../lib/profession";
import { auth } from "../../lib/session";
import { ProfessionPricelistRequestBodyRules } from "../../lib/validator-rules";
import { IModels } from "../../models";
import { IPricelistInstance, withoutEntries } from "../../models/pricelist";
import { IPricelistEntryInstance } from "../../models/pricelist-entry";
import { withoutPricelist } from "../../models/profession-pricelist";
import { IUserInstance, UserLevel } from "../../models/user";

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

export const getRouter = (models: IModels) => {
    const router = Router();
    const { Pricelist, PricelistEntry, ProfessionPricelist } = models;

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as IUserInstance;
            if (user.get("level") !== UserLevel.Admin) {
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

            const pricelist = await Pricelist.create({ ...result!.pricelist, user_id: user.id });
            const entries = await Promise.all(
                result.entries.map(v =>
                    PricelistEntry.create({
                        pricelist_id: pricelist.id,
                        ...v,
                    }),
                ),
            );
            const professionPricelist = await ProfessionPricelist.create({
                expansion: result.expansion_name,
                name: result.profession_name,
                pricelist_id: pricelist.id,
            });

            res.status(HTTPStatus.CREATED).json({
                entries: entries.map(v => v.toJSON()),
                pricelist: withoutEntries(pricelist),
                profession_pricelist: withoutPricelist(professionPricelist),
            });
        }),
    );

    router.delete(
        "/:id",
        auth,
        wrap(async (req: Request, res: Response) => {
            const user = req.user as IUserInstance;
            if (user.get("level") !== UserLevel.Admin) {
                res.status(HTTPStatus.UNAUTHORIZED).json({ unauthorized: "You are not authorized to do that." });

                return;
            }

            const professionPricelist = await ProfessionPricelist.findOne({
                include: [
                    {
                        include: [{ model: PricelistEntry }],
                        model: Pricelist,
                        where: { id: req.params["id"] },
                    },
                ],
            });
            if (professionPricelist === null) {
                res.status(HTTPStatus.NOT_FOUND).json({});

                return;
            }

            const pricelist: IPricelistInstance = professionPricelist.get("pricelist");
            if (pricelist.get("user_id") !== user.id) {
                res.status(HTTPStatus.UNAUTHORIZED).json({});

                return;
            }

            await Promise.all(pricelist.get("pricelist_attributes").map((v: IPricelistEntryInstance) => v.destroy()));
            await professionPricelist.destroy();
            await pricelist.destroy();
            res.json({});
        }),
    );

    return router;
};
