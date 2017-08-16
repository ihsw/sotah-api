import * as express from "express";
import { wrap } from "async-middleware";
import * as HttpStatus from "http-status";

import { default as Messenger } from "./messenger";

export default (messenger: Messenger): express.Express => {
  const app = express();

  app.get("/", (_, res) => res.send("Hello, world!"));
  app.get("/status", wrap(async (_, res) => {
    let status: string = "";
    try {
      status = await messenger.getStatus("us");
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message).end();

      return;
    }

    res.send(status).end();
  }));

  return app;
};
