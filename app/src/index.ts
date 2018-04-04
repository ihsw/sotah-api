import * as process from "process";

import { getApp } from "./lib/app";
import { getLogger } from "./lib/logger";

// logger init
const logger = getLogger("info");

// app init
const natsHost = process.env["NATS_HOST"] || "";
const natsPort = process.env["NATS_PORT"] || "";
const app = getApp({ logger, natsHost, natsPort });

const appPort = process.env["APP_PORT"];
const server = app.listen(appPort, () => logger.info(`Listening on ${appPort}`));
process.on("SIGTERM", () => {
  logger.info("Caught SIGTERM, closing server");
  server.close(() => {
    logger.info("Server closed, exiting");
    process.exit(0);
  });
});
