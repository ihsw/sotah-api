import * as express from "express";
import { wrap } from "async-middleware";
import * as HttpStatus from "http-status";

import { default as Messenger } from "./messenger";
import { IRegion } from "./region";

export default (messenger: Messenger): express.Express => {
  const app = express();

  app.get("/", (_, res) => res.send("Hello, world!"));
  app.get("/regions", wrap(async (_, res) => {
    let regions: IRegion[];
    try {
      regions = await messenger.getRegions();
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message).end();

      return;
    }

    res.send(regions).end();
  }));
  app.get("/status/:regionName", wrap(async (req, res) => {
    let status: string = "";
    try {
      status = await messenger.getStatus(req.params["regionName"]);
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message).end();

      return;
    }

    res.send(status).end();
  }));

  return app;
};
