import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";

import { Models } from "../../models";
import { UserInstance } from "../../models/user";
import { withoutEntries, PricelistInstance } from "../../models/pricelist";
import { PricelistEntryInstance } from "../../models/pricelist-entry";
import { withoutPricelist } from "../../models/profession-pricelist";
import { auth } from "../../lib/session";
import { ProfessionPricelistRequestBodyRules } from "../../lib/validator-rules";
import { ProfessionName } from "../../lib/profession";
import { ExpansionName } from "../../lib/expansion";

type ProfessionPricelistRequestBody = {
  pricelist: {
    name: string
  }
  entries: {
    id?: number
    item_id: number
    quantity_modifier: number
  }[]
  profession_name: ProfessionName
  expansion_name: ExpansionName
};

export const getRouter = (models: Models) => {
  const router = Router();
  const { Pricelist, PricelistEntry, ProfessionPricelist } = models;

  router.post("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    if (user.id !== 1) {
      res.status(HTTPStatus.UNAUTHORIZED).json({ unauthorized: "You are not authorized to do that." });

      return;
    }

    let result: ProfessionPricelistRequestBody | null = null;
    try {
      result = await ProfessionPricelistRequestBodyRules.validate(req.body) as ProfessionPricelistRequestBody;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json({ [err.path]: err.message });

      return;
    }

    const pricelist = await Pricelist.create({ ...result!.pricelist, user_id: user.id });
    const entries = await Promise.all(result.entries.map((v) => PricelistEntry.create({
      pricelist_id: pricelist.id,
      ...v
    })));
    const professionPricelist = await ProfessionPricelist.create({
      expansion: result.expansion_name,
      name: result.profession_name,
      pricelist_id: pricelist.id
    });

    res.status(HTTPStatus.CREATED).json({
      entries: entries.map((v) => v.toJSON()),
      pricelist: withoutEntries(pricelist),
      profession_pricelist: withoutPricelist(professionPricelist)
    });
  }));

  router.delete("/:id", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    if (user.id !== 1) {
      res.status(HTTPStatus.UNAUTHORIZED).json({ unauthorized: "You are not authorized to do that." });

      return;
    }

    const professionPricelist = await ProfessionPricelist.findOne({
      include: [{
        include: [{ model: PricelistEntry }],
        model: Pricelist,
        where: { id: req.params["id"] }
      }]
    });
    if (professionPricelist === null) {
      res.status(HTTPStatus.NOT_FOUND).json({});

      return;
    }

    const pricelist: PricelistInstance = professionPricelist.get("pricelist");
    if (pricelist.get("user_id") !== user.id) {
      res.status(HTTPStatus.UNAUTHORIZED).json({});

      return;
    }

    await Promise.all(pricelist.get("pricelist_entries").map((v: PricelistEntryInstance) => v.destroy()));
    await professionPricelist.destroy();
    await pricelist.destroy();
    res.json({});
  }));

  return router;
};
