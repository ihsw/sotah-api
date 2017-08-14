import * as express from "express";
import { wrap } from "async-middleware";

import Messenger from "./messenger";

export default (messenger: Messenger): express.Express => {
  const app = express();

  app.get("/", (_, res) => res.send("Hello, world!"));
  app.get("/status", wrap(async (_, res) => {
    const status = await messenger.getStatus();
    res.send(status).end();
  }));

  return app;
};
