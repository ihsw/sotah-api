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

const getConnectionField = async (documentFieldName: string, defaultValue?: string): Promise<string> => {
    if (firestoreDb === null) {
        return defaultValue || "";
    }

    const doc = await firestoreDb
        .collection("connection_info")
        .doc("current")
        .get();
    const data = doc.data();
    if (typeof data === "undefined") {
        return defaultValue || "";
    }
    if (!(documentFieldName in data)) {
        return defaultValue || "";
    }

    return data[documentFieldName];
};

const getConfig = async (documentFieldName: string, envVarName: string): Promise<string> => {
    if (firestoreDb === null) {
        return getEnvVar(envVarName);
    }

    return getConnectionField(documentFieldName, getEnvVar(envVarName));
};

// logger init
const logger = getLogger({ level: "debug", isGceEnv });

(async () => {
    // gathering runtime configs
    const appPort = process.env["PORT"] || 8080;
    const natsHost: string = await getConfig("nats_host", "NATS_HOST");
    const natsPort: string = await getConfig("nats_port", "NATS_PORT");
    const dbHost: string = await getConfig("db_host", "DB_HOST");
    const dbPassword: string = await getConfig("db_password", "DB_PASSWORD");

    const app = await getApp({ logger, natsHost, natsPort, dbHost, dbPassword, isGceEnv });
    if (app === null) {
        logger.info("Failed to initialize app");
        process.exit(-1);

        return;
    }

    logger.info("Calling listen", { appPort });
    app.listen(appPort, () => logger.info("Listening", { port: appPort }));
    logger.info("Called listen", { appPort });
})();
