import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";

import { Models } from "../../models";
import { UserInstance } from "../../models/user";
import { PricelistAttributes } from "../../models/pricelist";
import { PricelistEntryAttributes } from "../../models/pricelist-entry";
import { auth } from "../../lib/session";
import { PricelistRules, PricelistRequestBodyRules } from "../../lib/validator-rules";

type PricelistRequestBody = {
  pricelist: PricelistAttributes
  entries: PricelistEntryAttributes[]
};

export const getRouter = (models: Models) => {
  const router = Router();
  const { Pricelist, PricelistEntry } = models;

  router.post("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    let result: PricelistRequestBody | null = null;
    try {
      result = await PricelistRequestBodyRules.validate(req.body) as PricelistRequestBody;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

      return;
    }

    const pricelist = await Pricelist.create({ ...result!.pricelist, user_id: user.id });
    const entries = await Promise.all(result.entries.map((v) => PricelistEntry.create({
      pricelist_id: pricelist.id,
      ...v
    })));
    res.status(HTTPStatus.CREATED).json({
      pricelist: pricelist.toJSON(),
      entries: entries.map((v) => v.toJSON())
    });
  }));

  router.get("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    const pricelists = await Pricelist.findAll({
      where: { user_id: user.id }
    });
    res.json({ pricelists: pricelists.map((v) => v.toJSON()) });
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

    res.json({ pricelist: pricelist.toJSON() });
  }));

  router.put("/:id", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    const pricelist = await Pricelist.findOne({
      where: { id: req.params["id"], user_id: user.id }
    });
    if (pricelist === null) {
      res.status(HTTPStatus.NOT_FOUND);

      return;
    }

    let result: PricelistRequestBody | null = null;
    try {
      result = await PricelistRules.validate(req.body) as PricelistRequestBody;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

      return;
    }

    pricelist.setAttributes({ ...result.pricelist });
    pricelist.save();
    res.json({ pricelist: pricelist.toJSON() });
  }));

  return router;
};
