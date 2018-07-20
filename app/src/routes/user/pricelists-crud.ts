import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";

import { Models } from "../../models";
import { UserInstance } from "../../models/user";
import { PricelistAttributes, withoutEntries } from "../../models/pricelist";
import { PricelistEntryAttributes, PricelistEntryInstance } from "../../models/pricelist-entry";
import { auth } from "../../lib/session";
import { PricelistRequestBodyRules } from "../../lib/validator-rules";

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
    const entries = await PricelistEntry.bulkCreate(result.entries.map((v) => {
      return {
        pricelist_id: pricelist.id,
        ...v
      };
    }));
    res.status(HTTPStatus.CREATED).json({
      entries: entries.map((v) => v.toJSON()),
      pricelist: withoutEntries(pricelist)
    });
  }));

  router.get("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    const pricelists = await Pricelist.findAll({
      include: [PricelistEntry],
      where: { user_id: user.id }
    });
    res.json({ pricelists: pricelists.map((v) => v.toJSON()) });
  }));

  router.get("/:id", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    const pricelist = await Pricelist.findOne({
      include: [PricelistEntry],
      where: { id: req.params["id"], user_id: user.id }
    });
    if (pricelist === null) {
      res.status(HTTPStatus.NOT_FOUND);

      return;
    }

    res.json({ pricelist: pricelist.toJSON() });
  }));

  router.put("/:id", auth, wrap(async (req: Request, res: Response) => {
    // resolving the pricelist
    const user = req.user as UserInstance;
    const pricelist = await Pricelist.findOne({
      include: [PricelistEntry],
      where: { id: req.params["id"], user_id: user.id }
    });
    if (pricelist === null) {
      res.status(HTTPStatus.NOT_FOUND);

      return;
    }

    // validating the request body
    let result: PricelistRequestBody | null = null;
    try {
      result = await PricelistRequestBodyRules.validate(req.body) as PricelistRequestBody;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

      return;
    }

    // saving the pricelist
    pricelist.setAttributes({ ...result.pricelist });
    pricelist.save();

    // misc
    const entries = pricelist.get("pricelist_entries") as PricelistEntryInstance[];

    // creating new entries
    const newRequestEntries = result.entries.filter((v) => !!v.id === false);
    const newEntries = await PricelistEntry.bulkCreate(newRequestEntries);

    // updating existing entries
    const receivedRequestEntries = result.entries.filter((v) => !!v.id);
    const receivedEntries = await PricelistEntry.findAll({
      where: { id: receivedRequestEntries.map((v) => v.id!) }
    });
    receivedEntries.map((v, i) => v.setAttributes({ ...receivedRequestEntries[i] }));
    await Promise.all(receivedEntries.map((v) => v.save()));

    // gathering removed entries and deleting them
    const receivedEntryIds = receivedEntries.map((v) => v.id);
    const removedEntries = entries.filter((v) => receivedEntryIds.indexOf(v.id) === -1);
    await Promise.all(removedEntries.map((v) => v.destroy()));

    // dumping out a response
    res.json({
      entries: [...receivedEntries, ...newEntries].map((v) => v.toJSON()),
      pricelist: withoutEntries(pricelist),
    });
  }));

  return router;
};
