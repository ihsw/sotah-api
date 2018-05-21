import { Router } from "express";
import { wrap } from "async-middleware";
import * as HttpStatus from "http-status";

import { Messenger, code } from "../lib/messenger";
import { IRealm } from "../lib/realm";
import { AuctionsRequestBody, OwnersRequestBody, ItemsRequestBody, AuctionsQueryRequestBody } from "../lib/auction";

interface StatusRealm extends IRealm {
  regionName: string;
}

type StatusResponse = {
  realms: StatusRealm[]
};

export const getRouter = (messenger: Messenger): Router => {
  const router = Router();

  router.get("/regions", wrap(async (_, res) => {
    const msg = await messenger.getRegions();
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
      page,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"],
      sort_direction: sortDirection,
      sort_kind: sortKind,
      owner_filters: ownerFilters,
      item_filters: itemFilters
    });
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
  }));
  router.post("/region/:regionName/realm/:realmSlug/owners", wrap(async (req, res) => {
    const { query } = <OwnersRequestBody>req.body;
    const msg = await messenger.getOwners({
      query,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"]
    });
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
  }));
  router.post("/items", wrap(async (req, res) => {
    const { query } = <ItemsRequestBody>req.body;
    const msg = await messenger.getItems(query);
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
  }));
  router.post("/region/:regionName/realm/:realmSlug/query-auctions", wrap(async (req, res) => {
    const { query } = <AuctionsQueryRequestBody>req.body;
    const msg = await messenger.queryAuctions({
      query,
      realm_slug: req.params["realmSlug"],
      region_name: req.params["regionName"]
    });
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
  }));

  return router;
};
