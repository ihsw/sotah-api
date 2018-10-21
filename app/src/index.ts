import * as http from "http";
import * as process from "process";
import "reflect-metadata";

import { getApp } from "./lib/app";
import { getLogger } from "./lib/logger";

// logger init
const logger = getLogger("debug");

// app init
const natsHost = process.env["NATS_HOST"] || "";
const natsPort = process.env["NATS_PORT"] || "";
const dbHost = process.env["DB_HOST"] || "";

const appPort = process.env["APP_PORT"];
(async () => {
    const app = await getApp({ logger, natsHost, natsPort, dbHost });
    const server = http.createServer(app);
    server.listen(appPort, () => logger.info(`Listening on ${appPort}`));
    process.on("SIGTERM", () => {
        logger.info("Caught SIGTERM, closing server");
        server.close(() => {
            logger.info("Server closed, exiting");
            process.exit(0);
        });
    });
})();
