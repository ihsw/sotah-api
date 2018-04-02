import * as process from "process";

import { test } from "ava";
import * as supertest from "supertest";
import * as HttpStatus from "http-status";
import * as express from "express";
import * as nats from "nats";

import { getApp } from "../lib/app";
import { Messenger } from "../lib/messenger";
import { IRegion } from "../lib/region";
import { getLogger } from "../lib/logger";

interface ISetupSettings {
  app: express.Express;
  messenger: Messenger;
  request: supertest.SuperTest<supertest.Test>;
}

const setup = (): ISetupSettings => {
  const logger = getLogger();
  const messenger = new Messenger(nats.connect({
    url: `nats://${process.env["NATS_HOST"]}:${process.env["NATS_PORT"]}`
  }), logger);
  const app = getApp(messenger, logger);

  return { app, messenger, request: supertest(app) };
};

test("Homepage Should return standard greeting", async (t) => {
  const { request } = setup();

  const res = await request.get("/");
  t.is(res.status, HttpStatus.OK);
  t.is(res.text, "Hello, world!");
});

test("Regions Should return list of regions", async (t) => {
  const { request } = setup();

  const tId = setTimeout(() => { throw new Error("Timed out!"); }, 5 * 1000);

  const res = await request.get("/regions");
  clearTimeout(tId);

  t.is(res.status, HttpStatus.OK, "Http status is OK");
  const regions: IRegion[] = res.body;
  t.true(regions.length > 0);
});

test("Status Should return status information", async (t) => {
  const { request, messenger } = setup();

  const tId = setTimeout(() => { throw new Error("Timed out!"); }, 5 * 1000);

  const regions = (await messenger.getRegions()).data;
  t.true(regions.length > 0);

  const res = await request.get(`/status/${regions[0].name}`);
  clearTimeout(tId);

  t.is(res.status, HttpStatus.OK, "Http status is OK");
});

test("Status Should return 404 on invalid region name", async (t) => {
  const { request } = setup();

  const tId = setTimeout(() => { throw new Error("Timed out!"); }, 5 * 1000);

  const res = await request.get("/status/fdsfgs");
  clearTimeout(tId);

  t.is(res.status, HttpStatus.NOT_FOUND, "Http status is NOT_FOUND");
});

test("Internal-error Should return 500", async (t) => {
  const { request } = setup();

  const res = await request.get("/internal-error");
  t.is(res.status, HttpStatus.INTERNAL_SERVER_ERROR, "Http status is NOT_FOUND");
});
