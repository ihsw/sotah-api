import { Request, Router, Response } from "express";
import { wrap } from "async-middleware";
import * as HttpStatus from "http-status";
import { LoggerInstance } from "winston";

import { Models } from "../models";
import { Messenger, Message, code } from "../lib/messenger";
import { IRealm } from "../lib/realm";
import { AuctionsRequestBody, OwnersRequestBody, ItemsRequestBody, AuctionsQueryRequestBody, ItemId, OwnersQueryByItemsRequestBody, AuctionsQueryItem } from "../lib/auction";
import { PricelistEntryInstance } from "../models/pricelist-entry";
import { PriceListRequestBody, PricelistHistoryRequest, UnmetDemandRequestBody } from "../lib/price-list";
import { ProfessionPricelistInstance } from "../models/profession-pricelist";

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

export const getRouter = (models: Models, messenger: Messenger, logger: LoggerInstance) => {
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
    switch (msg.code) {
      case code.ok:
        const itemIds = msg.data!.auctions.map(v => v.itemId);
        const itemsMsg = await messenger.getItems(itemIds);
        if (itemsMsg.code !== code.ok) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(msg.error!.message).end();

          return;
        }

        res.send({
          ...msg.data!,
          items: itemsMsg.data!.items
        }).end();

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

    logger.info("Querying items");

    const itemsMessage = await messenger.queryItems(query);
    if (itemsMessage.code !== code.ok) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: itemsMessage.error });

      return;
    }

    logger.info("Querying owners");

    const ownersMessage = await messenger.queryOwners({
      query,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"],
    });
    if (ownersMessage.code !== code.ok) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: ownersMessage.error });

      return;
    }

    let items: AuctionsQueryItem[] = [
      ...itemsMessage.data!.items.map(v => {
        const result: AuctionsQueryItem = { ...v, owner: null };

        return result;
      }),
      ...ownersMessage.data!.items.map(v => {
        const result: AuctionsQueryItem = { ...v, item: null };

        return result;
      })
    ];
    items = items.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank > b.rank ? 1 : -1;
      }

      if (a.target !== b.target) {
        return a.target > b.target ? 1 : -1;
      }

      return 0;
    });
    items = items.slice(0, 10);

    res.json({ items });
  }));
  router.post("/region/:regionName/realm/:realmSlug/query-owner-items", wrap(async (req, res) => {
    const { items } = <OwnersQueryByItemsRequestBody>req.body;
    const msg = await messenger.queryOwnerItems({
      items,
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
  router.post("/region/:regionName/realm/:realmSlug/price-list-history", wrap(async (req, res) => {
    const { item_ids } = <PricelistHistoryRequest>req.body;
    const history = (await messenger.getPricelistHistories({
      item_ids,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"]
    })).data!.history;
    const items = (await messenger.getItems(item_ids)).data!.items;

    res.json({ history, items });
  }));
  router.post("/region/:regionName/realm/:realmSlug/unmet-demand", wrap(async (req, res) => {
    // gathering profession-pricelists
    const { expansion } = <UnmetDemandRequestBody>req.body;
    const professionPricelists = await ProfessionPricelist.findAll({
      include: [
        {
          include: [{ model: PricelistEntry, required: true }],
          model: Pricelist,
          required: true,
        }
      ],
      where: { expansion }
    });

    // gathering included item-ids
    const itemIds = professionPricelists.reduce((previousValue: ItemId[], v: ProfessionPricelistInstance) => {
      const pricelistEntries: PricelistEntryInstance[] = v.get("pricelist").get("pricelist_entries");
      const pricelistItemIds: ItemId[] = pricelistEntries.map(v => v.get("item_id"));
      for (const itemId of pricelistItemIds) {
        if (previousValue.indexOf(itemId) === -1) {
          previousValue.push(itemId);
        }
      }

      return previousValue;
    }, []);

    // gathering items
    const itemsMsg = await messenger.getItems(itemIds);
    if (itemsMsg.code !== code.ok) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: itemsMsg.error });

      return;
    }
    const items = itemsMsg.data!.items;

    // gathering pricing data
    const msg = await messenger.getPriceList({
      item_ids: itemIds,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"],
    });
    if (msg.code !== code.ok) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: msg.error });

      return;
    }
    const msgData = msg.data!;

    // gathering unmet items
    const unmetItemIds = itemIds.filter(v => !(v.toString() in msgData.price_list));

    // filtering in unmet profession-pricelists
    const unmetProfessionPricelists = professionPricelists.filter(v => {
      const pricelistEntries: PricelistEntryInstance[] = v.get("pricelist").get("pricelist_entries");
      const pricelistItemIds: ItemId[] = pricelistEntries.map(v => v.get("item_id"));
      const unmetPricelistItemIds = pricelistItemIds.filter(v => unmetItemIds.indexOf(v) > -1);

      return unmetPricelistItemIds.length > 0;
    });

    res.json({
      items,
      professionPricelists: unmetProfessionPricelists,
      unmetItemIds
    });
  }));
  router.get("/profession-pricelists/:profession_name", wrap(async (req: Request, res: Response) => {
    // gathering pricelists associated with this user, region, and realm
    const professionPricelists = await ProfessionPricelist.findAll({
      include: [
        {
          include: [{ model: PricelistEntry, required: true }],
          model: Pricelist,
          required: true,
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
