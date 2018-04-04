import * as process from "process";

import { test } from "ava";
import * as supertest from "supertest";
import * as HttpStatus from "http-status";
import * as express from "express";
import * as nats from "nats";

import { getApp } from "../../lib/app";
import { Messenger } from "../../lib/messenger";
import { getLogger } from "../../lib/logger";

interface ISetupSettings {
  app: express.Express;
  messenger: Messenger;
  request: supertest.SuperTest<supertest.Test>;
}

const setup = (): ISetupSettings => {
  const logger = getLogger();

  const natsHost = process.env["NATS_HOST"] as string;
  const natsPort = process.env["NATS_PORT"] as string;
  const messenger = new Messenger(nats.connect({ url: `nats://${natsHost}:${natsPort}` }), logger);

  const app = getApp({ logger, natsHost, natsPort });

  return { app, messenger, request: supertest(app) };
};

test("Homepage Should return standard greeting", async (t) => {
  const { request } = setup();

  const res = await request.get("/");
  t.is(res.status, HttpStatus.OK);
  t.is(res.text, "Hello, world!");
});

test("Internal-error Should return 500", async (t) => {
  const { request } = setup();

  const res = await request.get("/internal-error");
  t.is(res.status, HttpStatus.INTERNAL_SERVER_ERROR, "Http status is NOT_FOUND");
});
