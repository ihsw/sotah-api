import { wrap } from "async-middleware";
import { Request, Response, Router } from "express";

import { User } from "../../entities/user";
import { auth } from "../../lib/session";

export const getRouter = () => {
    const router = Router();

    router.get(
        "/",
        auth,
        wrap(async (req: Request, res: Response) => {
            res.json(req.user as User);
        }),
    );

    return router;
};
