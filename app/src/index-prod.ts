import * as http from "http";
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
const firestoreDb: Firestore | null = isGceEnv ? new Firestore() : null;

const getEnvVar = (envVarName: string): string => {
    const envVar = process.env[envVarName];
    if (typeof envVar === "undefined") {
        return "";
    }

    return envVar;
};

const getConfig = async (documentFieldName: string, envVarName: string): Promise<string> => {
    if (firestoreDb === null) {
        return getEnvVar(envVarName);
    }

    const doc = await firestoreDb
        .collection("connection_info")
        .doc("current")
        .get();
    const data = doc.data();
    if (typeof data === "undefined") {
        return getEnvVar(envVarName);
    }
    if (!(documentFieldName in data)) {
        return getEnvVar(envVarName);
    }

    return data[documentFieldName];
};

// logger init
const logger = getLogger({ level: "debug", isGceEnv });

(async () => {
    // gathering runtime configs
    const appPort = process.env["PORT"];
    const natsHost: string = await getConfig("nats_host", "NATS_HOST");
    const natsPort: string = await getConfig("nats_port", "NATS_PORT");
    const dbHost: string = await getConfig("db_host", "DB_HOST");
    const dbPassword: string = await getConfig("db_password", "DB_PASSWORD");

    const app = await getApp({ logger, natsHost, natsPort, dbHost, dbPassword, isGceEnv });
    const server = http.createServer(app);
    server.listen(appPort, () => logger.info("Listening", { port: appPort }));
})();
