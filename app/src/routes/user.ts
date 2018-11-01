import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import { Connection } from "typeorm";

import { handle } from "../controllers";
import { UserController } from "../controllers/user";
import { Messenger } from "../lib/messenger";
import { getRouter as getBaseRouter } from "./user/base";
import { getRouter as getPostsRouter } from "./user/posts-crud";
import { getRouter as getPreferencesRouter } from "./user/preferences";
import { getRouter as getPricelistsCrudRouter } from "./user/pricelists-crud";
import { getRouter as getProfessionPricelistsCrudRouter } from "./user/profession-pricelists-crud";

export const getRouter = (dbConn: Connection, messenger: Messenger) => {
    const router = Router();
    const controller = new UserController(messenger, dbConn);

    router.use("/user/posts", getPostsRouter());
    router.use("/user/preferences", getPreferencesRouter(dbConn));
    router.use("/user/pricelists", getPricelistsCrudRouter(dbConn, messenger));
    router.use("/user/profession-pricelists", getProfessionPricelistsCrudRouter(dbConn));
    router.use("/user", getBaseRouter());

    router.post(
        "/users",
        wrap(async (req: Request, res: Response) => {
            await handle(controller.createUser, req, res);
        }),
    );

    router.post(
        "/login",
        wrap(async (req: Request, res: Response) => {
            await handle(controller.login, req, res);
        }),
    );

    return router;
};
