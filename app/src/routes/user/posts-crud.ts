import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";
import { Connection } from "typeorm";

import { handle } from "../../controllers";
import { PostCrudController } from "../../controllers/user/post-crud";
import { auth } from "../../lib/session";

export const getRouter = (dbConn: Connection) => {
    const router = Router();
    const controller = new PostCrudController(dbConn);

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.createPost.bind(controller), req, res);
        }),
    );

    router.put(
        "/:post_id",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.updatePost.bind(controller), req, res);
        }),
    );

    router.get(
        "/:post_id",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.getPost.bind(controller), req, res);
        }),
    );

    router.delete(
        "/:post_id",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.deletePost.bind(controller), req, res);
        }),
    );

    return router;
};
