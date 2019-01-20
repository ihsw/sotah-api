import * as compression from "compression";
import * as express from "express";
import * as HttpStatus from "http-status";
import * as nats from "nats";
import { createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "winston";

import { Post } from "../entities/post";
import { Preference } from "../entities/preference";
import { Pricelist } from "../entities/pricelist";
import { PricelistEntry } from "../entities/pricelist-entry";
import { ProfessionPricelist } from "../entities/profession-pricelist";
import { User } from "../entities/user";
import { defaultRouter, getDataRouter, getUserRouter } from "../routes";
import { Messenger } from "./messenger";
import { appendSessions } from "./session";

export interface IOptions {
    logger: Logger;
    natsHost: string;
    natsPort: string;
    dbHost: string;
    isGceEnv: boolean;
}

export const getApp = async (opts: IOptions): Promise<express.Express> => {
    const { logger, natsHost, natsPort, dbHost } = opts;

    logger.info("Starting app");

    // express init
    let app = express();
    app.use(express.json());
    app.use(compression());

    // messenger init
    const messenger = new Messenger(nats.connect({ url: `nats://${natsHost}:${natsPort}` }));

    // db init
    const dbConn = await createConnection({
        database: "postgres",
        entities: [Preference, Pricelist, PricelistEntry, ProfessionPricelist, User, Post],
        host: dbHost,
        logging: false,
        name: `app-${uuidv4()}`,
        password: "",
        port: 5432,
        synchronize: false,
        type: "postgres",
        username: "postgres",
    });

    // session init
    app = await appendSessions(app, messenger, dbConn);

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
    app.use("/", getDataRouter(dbConn, messenger));
    app.use("/", getUserRouter(dbConn, messenger));

    // error handler
    app.use((err: Error, _: express.Request, res: express.Response, next: () => void) => {
        logger.error("Dumping out error response", { error: err });

        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message);
        next();
    });

    return app;
};
