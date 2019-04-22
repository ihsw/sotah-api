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
    dbPassword?: string;
    isGceEnv: boolean;
}

export const getApp = async (opts: IOptions): Promise<express.Express | null> => {
    const { logger, natsHost, natsPort, dbHost, dbPassword } = opts;

    logger.info("Starting app");

    // const errors = isGceEnv ? new ErrorReporting() : null;

    // express init
    let app = express();
    app.set("etag", false);
    app.use(express.json());
    app.use(compression());
    app.use((_, res, next) => {
        res.set("Cache-Control", "private");
        next();
    });

    // messenger init
    logger.info("Connecting to nats", { natsHost, natsPort });
    const natsConnection = await (async () => {
        const conn = nats.connect({
            maxReconnectAttempts: 5,
            reconnectTimeWait: 100,
            url: `nats://${natsHost}:${natsPort}`,
        });
        return new Promise<nats.Client | null>(resolve => {
            conn.on("connect", () => resolve(conn));
            conn.on("error", err => {
                logger.error("Failed to connect to nats", { err });

                resolve(null);
            });
            setTimeout(() => {
                logger.error("Timed out when connecting to nats");

                resolve(null);
            }, 10 * 1000);
        });
    })();
    if (natsConnection === null) {
        return null;
    }
    const messenger = new Messenger(natsConnection);
    await messenger.getBoot();

    // db init
    logger.info("Connecting to db", { dbHost, dbPassword });
    const dbConn = await (async () => {
        try {
            return await createConnection({
                database: "postgres",
                entities: [Preference, Pricelist, PricelistEntry, ProfessionPricelist, User, Post],
                host: dbHost,
                logging: false,
                name: `app-${uuidv4()}`,
                password: typeof dbPassword !== "undefined" ? dbPassword : "",
                port: 5432,
                synchronize: false,
                type: "postgres",
                username: "postgres",
            });
        } catch (err) {
            logger.error("Failed to connect to db", { err });

            return null;
        }
    })();
    if (dbConn === null) {
        return null;
    }

    // session init
    logger.info("Appending session middleware");
    app = await appendSessions(app, messenger, dbConn);

    // request logging
    logger.info("Appending cors middleware");
    app.use((req, res, next) => {
        logger.info("Received HTTP request", { url: req.originalUrl, method: req.method });

        res.set("access-control-allow-origin", "*");
        res.set("access-control-allow-headers", "content-type,authorization");
        res.set("access-control-allow-methods", "GET,POST,PUT,DELETE");
        next();
    });

    // route init
    logger.info("Appending route middlewares");
    app.use("/", defaultRouter);
    app.use("/", getDataRouter(dbConn, messenger));
    app.use("/", getUserRouter(dbConn, messenger));

    // error handlers
    // if (isGceEnv && errors !== null) {
    //     logger.info("Appending gcp error-reporting");

    //     app.use(errors.express);
    // }
    logger.info("Appending error middleware");
    app.use((err: Error, _: express.Request, res: express.Response, next: () => void) => {
        logger.error("Dumping out error response", { error: err });

        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err.message);
        next();
    });

    return app;
};
