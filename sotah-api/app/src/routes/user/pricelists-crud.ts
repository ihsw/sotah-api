import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";

import { Models } from "../../models";
import { UserInstance } from "../../models/user";
import { withoutEntries } from "../../models/pricelist";
import { PricelistEntryInstance } from "../../models/pricelist-entry";
import { ItemId } from "../../lib/auction";
import { auth } from "../../lib/session";
import { PricelistRequestBodyRules } from "../../lib/validator-rules";
import { Messenger } from "../../lib/messenger";

type PricelistRequestBody = {
  pricelist: {
    name: string
  }
  entries: {
    id?: number
    item_id: number
    quantity_modifier: number
  }[]
};

export const getRouter = (models: Models, messenger: Messenger) => {
  const router = Router();
  const { Pricelist, PricelistEntry, ProfessionPricelist } = models;

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
      entries: entries.map((v) => v.toJSON()),
      pricelist: withoutEntries(pricelist)
    });
  }));

  router.get("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;

    // gathering pricelists associated with this user
    let pricelists = await Pricelist.findAll({
      include: [PricelistEntry, ProfessionPricelist],
      where: { user_id: user.id }
    });

    // filtering out profession-pricelists
    pricelists = pricelists.filter(v => !!v.get("profession_pricelist") === false);

    // gathering related items
    const itemIds: ItemId[] = pricelists.reduce((itemIds: ItemId[], pricelist) => {
      return pricelist.get("pricelist_entries").reduce((itemIds: ItemId[], entry: PricelistEntryInstance) => {
        const entryJson = entry.toJSON();
        if (itemIds.indexOf(entryJson.item_id) === -1) {
          itemIds.push(entryJson.item_id);
        }

        return itemIds;
      }, itemIds);
    }, []);
    const items = (await messenger.getItems(itemIds)).data!.items;

    // dumping out a response
    res.json({ pricelists: pricelists.map((v) => v.toJSON()), items });
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
    const newEntries = await Promise.all(newRequestEntries.map(
      (v) => PricelistEntry.create({ ...v, pricelist_id: pricelist.id })
    ));

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

  router.delete("/:id", auth, wrap(async (req: Request, res: Response) => {
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

    await Promise.all(pricelist.get("pricelist_entries").map((v: PricelistEntryInstance) => v.destroy()));
    await pricelist.destroy();
    res.json({});
  }));

  return router;
};
