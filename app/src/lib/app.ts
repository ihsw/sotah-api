import * as express from "express";
import * as HttpStatus from "http-status";
import * as nats from "nats";
import { LoggerInstance } from "winston";
import * as Sequelize from "sequelize";

import { Messenger } from "./messenger";
import { defaultRouter, getDataRouter, getUserRouter } from "../routes";
import { createModels } from "../models";

export type Options = {
  logger: LoggerInstance
  natsHost: string
  natsPort: string,
  dbHost: string
};

export const getApp = (opts: Options): express.Express => {
  const { logger, natsHost, natsPort, dbHost } = opts;

  // express init
  const app = express();
  app.use(express.json());

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

  // request logging
  app.use((req, res, next) => {
    logger.info("Received HTTP request", { url: req.originalUrl });

    res.set("access-control-allow-origin", "*");
    next();
  });

  // route init
  app.use("/", defaultRouter);
  app.use("/", getDataRouter(messenger));
  app.use("/", getUserRouter(models.User));

  // error handler
  app.use((err: Error, _: express.Request, res: express.Response, next: Function) => {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message);
    next();
  });

  return app;
};
