import * as process from "process";
import "reflect-metadata";

import { test } from "ava";
import * as HttpStatus from "http-status";

import { getLogger } from "../../lib/logger";
import { setup } from "../../lib/test-helper";

const helper = async () => {
    const { request } = await setup({
        dbHost: process.env["DB_HOST"] as string,
        isGceEnv: false,
        logger: getLogger(),
        natsHost: process.env["NATS_HOST"] as string,
        natsPort: process.env["NATS_PORT"] as string,
    });

    return { request };
};

test("Homepage Should return standard greeting", async t => {
    const { request } = await helper();

    const res = await request.get("/");
    t.is(res.status, HttpStatus.OK);
    t.is(res.text, "Hello, world!");
});

test("Ping Should return pong", async t => {
    const { request } = await helper();

    const res = await request.get("/ping");
    t.is(res.status, HttpStatus.OK);
    t.is(res.text, "Pong");
});

test("Internal-error Should return 500", async t => {
    const { request } = await helper();

    const res = await request.get("/internal-error");
    t.is(res.status, HttpStatus.INTERNAL_SERVER_ERROR, "Http status is NOT_FOUND");
});
