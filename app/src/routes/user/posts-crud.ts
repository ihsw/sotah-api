import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";

import { handle } from "../../controllers";
import { PostCrudController } from "../../controllers/user/post-crud";
import { auth } from "../../lib/session";

export const getRouter = () => {
    const router = Router();
    const controller = new PostCrudController();

    router.post(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            await handle(controller.createPost, req, res);
        }),
    );

    return router;
};
