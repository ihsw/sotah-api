import * as nats from "nats";

import { getApp } from "./lib/app";
import { Messenger } from "./lib/messenger";
import { getLogger } from "./lib/logger";

const logger = getLogger();

const messenger = new Messenger(nats.connect({
  url: `nats://${process.env["NATS_HOST"]}:${process.env["NATS_PORT"]}`
}));
const app = getApp(messenger);

const appPort = process.env["APP_PORT"];
const server = app.listen(appPort, () => logger.info(`Listening on ${appPort}`));
process.on("SIGTERM", () => {
  logger.info("Caught SIGTERM, closing server");
  server.close(() => {
    logger.info("Server closed, exiting");
    process.exit(0);
  });
});
