import * as cluster from "cluster";
import * as http from "http";
import * as os from "os";
import * as process from "process";

import { Firestore } from "@google-cloud/firestore";
import "reflect-metadata";

import { getApp } from "./lib/app";
import { getLogger } from "./lib/logger";

// env-var loading
const isGceEnv = (() => {
    const result = process.env["IS_GCE_ENV"] || "";
    return result === "1";
})();

// optionally loading firestore
const firestoreDb: Firestore | null = isGceEnv ? null : new Firestore();

const getEnvVar = (envVarName: string): string => {
    const envVar = process.env[envVarName];
    if (typeof envVar === "undefined") {
        console.log("env-var was undefined", envVarName);

        return "";
    }

    return envVar;
};

const getConfig = async (documentFieldName: string, envVarName: string): Promise<string> => {
    if (firestoreDb === null) {
        console.log("firebase-db was null", documentFieldName, envVarName);

        return getEnvVar(envVarName);
    }

    const doc = await firestoreDb
        .collection("connection_info")
        .doc("current")
        .get();
    const data = doc.data();
    if (typeof data === "undefined") {
        console.log("data was undefined", documentFieldName, envVarName);

        return getEnvVar(envVarName);
    }
    if (!(documentFieldName in data)) {
        console.log("document-field-name was not in data", documentFieldName, envVarName);

        return getEnvVar(envVarName);
    }

    console.log("successfully resolved result from firestore", documentFieldName, envVarName);

    return data[documentFieldName];
};

// logger init
const logger = getLogger({ level: "debug", isGceEnv });

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
        // gathering runtime configs
        const appPort = process.env["PORT"];
        const natsHost: string = await getConfig("nats_host", "NATS_HOST");
        const natsPort = process.env["NATS_PORT"] || "";
        const dbHost = process.env["DB_HOST"] || "";
        const dbPassword = process.env["DB_PASSWORD"] || "";

        const app = await getApp({ logger, natsHost, natsPort, dbHost, dbPassword, isGceEnv });
        const server = http.createServer(app);
        server.listen(appPort, () => logger.info("Listening", { port: appPort }));
    })();
}
