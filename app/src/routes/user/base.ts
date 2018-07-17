import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";

import { Models } from "../../models";
import { auth } from "../../lib/session";
import { withoutPassword, UserInstance } from "../../models/user";

export const getRouter = (models: Models) => {
  const router = Router();
  const { User } = models;

  router.get("/", auth, wrap(async (req: Request, res: Response) => {
    res.json(withoutPassword(req.user as UserInstance));
  }));

  router.get("/:id", wrap(async (req: Request, res: Response) => {
    const user = await User.findById(req.params["id"]);
    if (user === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    res.json(withoutPassword(user));
  }));

  router.delete("/:id", wrap(async (req: Request, res: Response) => {
    const user = await User.findById(req.params["id"]);
    if (user === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    await User.destroy({ where: { id: user.id } });
    res.json({});
  }));

  router.put("/:id", wrap(async (req: Request, res: Response) => {
    const user = await User.findById(req.params["id"]);
    if (user === null) {
      res.status(HTTPStatus.NOT_FOUND).send();

      return;
    }

    user.set("email", req.body.email);
    user.save();
    res.json(withoutPassword(user));
  }));

  return router;
};
