import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import { Connection } from "typeorm";

import { handle } from "../../controllers";
import { PreferencesController } from "../../controllers/user/preferences";
import { auth } from "../../lib/session";

export const getRouter = (dbConn: Connection) => {
    const router = Router();
    const controller = new PreferencesController(dbConn);

    router.get(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.getPreferences.bind(controller), req, res);
        }),
    );

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.createPreferences.bind(controller), req, res);
        }),
    );

    router.put(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.updatePreferences.bind(controller), req, res);
        }),
    );

    return router;
};
