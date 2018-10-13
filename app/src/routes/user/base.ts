import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";

import { IModels } from "../../models";
import { auth } from "../../lib/session";
import { withoutPassword, IUserInstance } from "../../models/user";

export const getRouter = (models: IModels) => {
  const router = Router();
  const { User } = models;

  router.get("/", auth, wrap(async (req: Request, res: Response) => {
    res.json(withoutPassword(req.user as IUserInstance));
  }));

  router.get("/:id", wrap(async (req: Request, res: Response) => {
    const user = await User.findById(req.params["id"]);
    if (user === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    res.json(withoutPassword(user));
  }));

  return router;
};
