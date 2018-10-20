import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import { Connection } from "typeorm";

import { handle } from "../../controllers";
import { PreferenceController } from "../../controllers/user/preference";
import { auth } from "../../lib/session";

export const getRouter = (dbConn: Connection) => {
    const router = Router();
    const controller = new PreferenceController(dbConn);

    router.get(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.getPreferences, req, res);
        }),
    );

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.createPreferences, req, res);
        }),
    );

    router.put(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.updatePreferences, req, res);
        }),
    );

    return router;
};
