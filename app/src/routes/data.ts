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
    const msg = await messenger.getAuctions(req.params["regionName"], req.params["realmSlug"]);
    if (msg.code === code.notFound) {
      res.status(HttpStatus.NOT_FOUND).send(msg.error!.message).end();

      return;
    }

    res.send(msg.data).end();
  }));

  return router;
};
