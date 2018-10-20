import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { Connection } from "typeorm";

import { handle } from "../../controllers";
import { PricelistCrudController } from "../../controllers/user/pricelist-crud";
import { Pricelist, PricelistEntry, User } from "../../entities";
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
    const controller = new PricelistCrudController(dbConn, messenger);

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.createPricelist, req, res);
        }),
    );

    router.get(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.getPricelists, req, res);
        }),
    );

    router.get(
        "/:id",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.getPricelist, req, res);
        }),
    );

    router.put(
        "/:id",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.updatePricelist, req, res);
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
