import { Request, Router, Response } from "express";
import { wrap } from "async-middleware";
import * as HttpStatus from "http-status";

import { Models } from "../models";
import { Messenger, Message, code } from "../lib/messenger";
import { IRealm } from "../lib/realm";
import { AuctionsRequestBody, OwnersRequestBody, ItemsRequestBody, AuctionsQueryRequestBody, ItemId } from "../lib/auction";
import { PricelistEntryInstance } from "../models/pricelist-entry";
import { PriceListRequestBody } from "../lib/price-list";

interface StatusRealm extends IRealm {
  regionName: string;
}

type StatusResponse = {
  realms: StatusRealm[]
};

export const handleMessage = <T>(res: Response, msg: Message<T>) => {
  switch (msg.code) {
    case code.ok:
      res.send(msg.data).end();

      return;
    case code.notFound:
      res.status(HttpStatus.NOT_FOUND).send(msg.error!.message).end();

      return;
    case code.userError:
      res.status(HttpStatus.BAD_REQUEST).send(msg.error!.message).end();

      return;
    default:
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(msg.error!.message).end();

      return;
  }
};

export const getRouter = (models: Models, messenger: Messenger) => {
  const router = Router();
  const { Pricelist, PricelistEntry, ProfessionPricelist } = models;

  router.get("/regions", wrap(async (_, res) => {
    const msg = await messenger.getRegions();
    res.send(msg.data).end();
  }));
  router.get("/item-classes", wrap(async (_, res) => {
    const msg = await messenger.getItemClasses();
    res.send(msg.data).end();
  }));
  router.get("/boot", wrap(async (_, res) => {
    const msg = await messenger.getBoot();
    res.send(msg.data).end();
  }));
  router.get("/region/:regionName/realms", wrap(async (req, res) => {
    const msg = await messenger.getStatus(req.params["regionName"]);
    if (msg.code === code.notFound) {
      res.status(HttpStatus.NOT_FOUND).end();

      return;
    }

    const response: StatusResponse = {
      realms: msg.data!.realms.map((realm) => {
        return { ...realm, regionName: req.params["regionName"] };
      })
    };

    res.send(response).end();
  }));
  router.post("/region/:regionName/realm/:realmSlug/auctions", wrap(async (req, res) => {
    const { count, page, sortDirection, sortKind, ownerFilters, itemFilters } = <AuctionsRequestBody>req.body;
    const msg = await messenger.getAuctions({
      count,
      item_filters: itemFilters,
      owner_filters: ownerFilters,
      page,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"],
      sort_direction: sortDirection,
      sort_kind: sortKind
    });
    handleMessage(res, msg);
  }));
  router.post("/region/:regionName/realm/:realmSlug/owners", wrap(async (req, res) => {
    const { query } = <OwnersRequestBody>req.body;
    const msg = await messenger.getOwners({
      query,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"]
    });
    handleMessage(res, msg);
  }));
  router.post("/items", wrap(async (req, res) => {
    const { query } = <ItemsRequestBody>req.body;
    const msg = await messenger.queryItems(query);
    handleMessage(res, msg);
  }));
  router.post("/region/:regionName/realm/:realmSlug/query-auctions", wrap(async (req, res) => {
    const { query } = <AuctionsQueryRequestBody>req.body;
    const msg = await messenger.queryAuctions({
      query,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"]
    });
    handleMessage(res, msg);
  }));
  router.post("/region/:regionName/realm/:realmSlug/price-list", wrap(async (req, res) => {
    const { item_ids } = <PriceListRequestBody>req.body;
    const price_list = (await messenger.getPriceList({
      item_ids,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"]
    })).data!.price_list;
    const items = (await messenger.getItems(item_ids)).data!.items;

    res.json({ price_list, items });
  }));
  router.get("/region/:regionName/realm/:realmSlug/profession-pricelists/:profession_name", wrap(async (req: Request, res: Response) => {
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

  return router;
};
