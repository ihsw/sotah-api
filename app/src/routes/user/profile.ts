import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import { Connection } from "typeorm";

import { handle } from "../../controllers";
import { ProfileController } from "../../controllers/user/profile";
import { auth } from "../../lib/session";

export const getRouter = (dbConn: Connection) => {
    const router = Router();
    const controller = new ProfileController(dbConn);

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.updateProfile.bind(controller), req, res);
        }),
    );

    return router;
};
