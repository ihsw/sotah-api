import * as process from "process";

import { test } from "ava";
import * as supertest from "supertest";
import * as HttpStatus from "http-status";
import * as express from "express";
import * as nats from "nats";

import getApp from "../lib/app";

interface ISetupSettings {
    request: supertest.SuperTest<supertest.Test>;
    app: express.Express;
    natsConnection: nats.Client;
}

const setup = (): ISetupSettings => {
    const natsConnection = nats.connect({
        url: `nats://${process.env["NATS_HOST"]}:${process.env["NATS_PORT"]}`
    });

    const app = getApp(natsConnection);

    return { natsConnection, app, request: supertest(app) };
};

test("Homepage Should return standard greeting", async (t) => {
  const { request } = setup();

  const res = await request.get("/");
  t.is(res.status, HttpStatus.OK);
  t.is(res.text, "Hello, world!");
});
