import * as process from "process";

const config = {
    development: {
        database: "postgres",
        dialect: "postgres",
        host: process.env["DB_HOST"] as string,
        password: null,
        username: "postgres",
    },
};

export = config;
