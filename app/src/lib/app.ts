import * as express from "express";
import * as HttpStatus from "http-status";
import * as nats from "nats";
import { LoggerInstance } from "winston";
import * as Sequelize from "sequelize";
import * as compression from "compression";

import { Messenger } from "./messenger";
import { defaultRouter, getDataRouter, getUserRouter } from "../routes";
import { createModels } from "../models";
import { appendSessions } from "./session";

export type Options = {
  logger: LoggerInstance
  natsHost: string
  natsPort: string,
  dbHost: string
};

export const getApp = (opts: Options): express.Express => {
  const { logger, natsHost, natsPort, dbHost } = opts;

  // express init
  let app = express();
  app.use(express.json());
  app.use(compression());

  // messenger init
  const messenger = new Messenger(nats.connect({ url: `nats://${natsHost}:${natsPort}` }), logger);

  // db init
  const sequelize = new Sequelize("postgres", "postgres", "", <Sequelize.Options>{
    define: { timestamps: false },
    dialect: "postgres",
    host: dbHost,
    logging: false,
    operatorsAliases: false
  });
  const models = createModels(sequelize);

  // session init
  app = appendSessions(app, models.User);

  // request logging
  app.use((req, res, next) => {
    logger.info("Received HTTP request", { url: req.originalUrl, method: req.method });

    res.set("access-control-allow-origin", "*");
    res.set("access-control-allow-headers", "content-type,authorization");
    next();
  });

  // static assets
  app.use("/item-icons", express.static("/tmp/item-icons"));

  // route init
  app.use("/", defaultRouter);
  app.use("/", getDataRouter(messenger));
  app.use("/", getUserRouter(models));

  // error handler
  app.use((err: Error, _: express.Request, res: express.Response, next: Function) => {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message);
    next();
  });

  return app;
};
