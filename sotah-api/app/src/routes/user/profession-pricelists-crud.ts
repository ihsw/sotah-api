import { Request, Response, Router } from "express";
import * as HTTPStatus from "http-status";
import { wrap } from "async-middleware";

import { Models } from "../../models";
import { UserInstance } from "../../models/user";
import { withoutEntries, PricelistInstance } from "../../models/pricelist";
import { PricelistEntryInstance } from "../../models/pricelist-entry";
import { withoutPricelist } from "../../models/profession-pricelist";
import { ItemId } from "../../lib/auction";
import { regionName } from "../../lib/region";
import { realmSlug } from "../../lib/realm";
import { auth } from "../../lib/session";
import { ProfessionPricelistRequestBodyRules } from "../../lib/validator-rules";
import { Messenger } from "../../lib/messenger";
import { ProfessionName } from "../../lib/profession";

type ProfessionPricelistRequestBody = {
  pricelist: {
    name: string
    region: regionName
    realm: realmSlug
  }
  entries: {
    id?: number
    item_id: number
    quantity_modifier: number
  }[]
  profession_name: ProfessionName
};

export const getRouter = (models: Models, messenger: Messenger) => {
  const router = Router();
  const { Pricelist, PricelistEntry, ProfessionPricelist } = models;

  router.post("/", auth, wrap(async (req: Request, res: Response) => {
    const user = req.user as UserInstance;
    let result: ProfessionPricelistRequestBody | null = null;
    try {
      result = await ProfessionPricelistRequestBodyRules.validate(req.body) as ProfessionPricelistRequestBody;
    } catch (err) {
      res.status(HTTPStatus.BAD_REQUEST).json(err.errors);

      return;
    }

    const pricelist = await Pricelist.create({ ...result!.pricelist, user_id: user.id });
    const entries = await Promise.all(result.entries.map((v) => PricelistEntry.create({
      pricelist_id: pricelist.id,
      ...v
    })));
    const professionPricelist = await ProfessionPricelist.create({
        name: result.profession_name,
        pricelist_id: pricelist.id
    });

    res.status(HTTPStatus.CREATED).json({
      entries: entries.map((v) => v.toJSON()),
      pricelist: withoutEntries(pricelist),
      profession_pricelist: withoutPricelist(professionPricelist)
    });
  }));

  router.get("/region/:regionName/realm/:realmSlug/:profession_name", wrap(async (req: Request, res: Response) => {
    // gathering pricelists associated with this user, region, and realm
    const professionPricelists = await ProfessionPricelist.findAll({
      include: [
        {
          include: [{ model: PricelistEntry, required: true }],
          model: Pricelist,
          required: true,
          where: { region: req.params["regionName"], realm: req.params["realmSlug"] }
        }
      ],
      where: { name: req.params["profession_name"] }
    });

    // gathering related items
    const itemIds: ItemId[] = professionPricelists.reduce((itemIds: ItemId[], professionPricelist) => {
      return professionPricelist.get("pricelist").get("pricelist_entries").reduce((itemIds: ItemId[], entry: PricelistEntryInstance) => {
        const entryJson = entry.toJSON();
        if (itemIds.indexOf(entryJson.item_id) === -1) {
          itemIds.push(entryJson.item_id);
        }

        return itemIds;
      }, itemIds);
    }, []);
    const items = (await messenger.getItems(itemIds)).data!.items;

    // dumping out a response
    res.json({ profession_pricelists: professionPricelists.map((v) => v.toJSON()), items });
  }));

  router.delete("/:id", auth, wrap(async (req: Request, res: Response) => {
    // resolving the profession-pricelist
    const user = req.user as UserInstance;
    const professionPricelist = await ProfessionPricelist.findOne({
      include: [{
        include: [{ model: PricelistEntry }],
        model: Pricelist
      }],
      where: { id: req.params["id"] }
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
