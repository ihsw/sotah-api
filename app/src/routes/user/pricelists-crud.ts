import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";

import { Models } from "../../models";
import { UserInstance } from "../../models/user";
import { PricelistAttributes } from "../../models/pricelist";
import { auth } from "../../lib/session";
import { PricelistRules } from "../../lib/validator-rules";

export const getRouter = (models: Models) => {
  const router = Router();
  const { Pricelist } = models;

  router.post("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    let result: PricelistAttributes | null = null;
    try {
      result = await PricelistRules.validate(req.body) as PricelistAttributes;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

      return;
    }

    const pricelist = await Pricelist.create({ ...result!, user_id: user.id });
    res.status(HTTPStatus.CREATED).json({ pricelist: pricelist.toJSON() });
  }));

  router.get("/:id", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    const pricelist = await Pricelist.findOne({
      where: { id: req.params["id"], user_id: user.id }
    });
    if (pricelist === null) {
      res.status(HTTPStatus.NOT_FOUND);

      return;
    }

    res.json({ pricelist: pricelist.toJSON });
  }));

  router.get("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    const pricelists = await Pricelist.findAll({
      where: { user_id: user.id }
    });
    res.json({ pricelists: pricelists.map((v) => v.toJSON()) });
  }));

  return router;
};
