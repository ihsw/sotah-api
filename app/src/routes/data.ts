import { Router } from "express";
import { wrap } from "async-middleware";
import * as HttpStatus from "http-status";

import { Messenger, code } from "../lib/messenger";

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

    res.send(msg.data).end();
  }));
  router.get("/region/:regionName/realm/:realmSlug/auctions", wrap(async (req, res) => {
    const count = "count" in req.query ? Number(req.query.count) : 10;
    const page = "page" in req.query ? Number(req.query.page) : 0;
    const msg = await messenger.getAuctions({
      count,
      page,
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
