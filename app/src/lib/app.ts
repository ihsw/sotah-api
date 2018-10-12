import * as compression from "compression";
import * as express from "express";
import * as HttpStatus from "http-status";
import * as nats from "nats";
import * as Sequelize from "sequelize";
import { LoggerInstance } from "winston";

import { createModels } from "../models";
import { defaultRouter, getDataRouter, getUserRouter } from "../routes";
import { Messenger } from "./messenger";
import { appendSessions } from "./session";

export interface IOptions {
    logger: LoggerInstance;
    natsHost: string;
    natsPort: string;
    dbHost: string;
}

export const getApp = async (opts: IOptions): Promise<express.Express> => {
    const { logger, natsHost, natsPort, dbHost } = opts;

    // express init
    let app = express();
    app.use(express.json());
    app.use(compression());

    // messenger init
    const messenger = new Messenger(nats.connect({ url: `nats://${natsHost}:${natsPort}` }), logger);

    // db init
    const sequelize = new Sequelize("postgres", "postgres", "", {
        define: { timestamps: false },
        dialect: "postgres",
        host: dbHost,
        logging: false,
        operatorsAliases: false,
    });
    const models = createModels(sequelize);

    // session init
    app = await appendSessions(app, messenger, models.User);

    // request logging
    app.use((req, res, next) => {
        logger.info("Received HTTP request", { url: req.originalUrl, method: req.method });

        res.set("access-control-allow-origin", "*");
        res.set("access-control-allow-headers", "content-type,authorization");
        res.set("access-control-allow-methods", "GET,POST,PUT,DELETE");
        next();
    });

    // static assets
    app.use("/item-icons", express.static("/tmp/item-icons"));

    // route init
    app.use("/", defaultRouter);
    app.use("/", getDataRouter(models, messenger));
    app.use("/", getUserRouter(models, messenger));

    // error handler
    app.use((err: Error, _: express.Request, res: express.Response, next: () => void) => {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message);
        next();
    });

    return app;
};
