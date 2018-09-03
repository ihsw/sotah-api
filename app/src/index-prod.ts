import * as cluster from "cluster";
import * as process from "process";
import * as http from "http";
import * as os from "os";

import { getApp } from "./lib/app";
import { getLogger } from "./lib/logger";

// env-var loading
const natsHost = process.env["NATS_HOST"] || "";
const natsPort = process.env["NATS_PORT"] || "";
const dbHost = process.env["DB_HOST"] || "";
const appPort = process.env["APP_PORT"];

// logger init
const logger = getLogger("debug");

if (cluster.isMaster) {
  const numCpus = os.cpus().length;

  for (let i = 0; i < numCpus; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.info("Worker exited", { code, pid: worker.process.pid, signal });
  });
} else {
  (async () => {
    const app = await getApp({ logger, natsHost, natsPort, dbHost });
    const server = http.createServer(app);
    server.listen(appPort, () => logger.info("Listening", { port: appPort }));
  })();
}
