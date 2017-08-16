import * as process from "process";

import { test } from "ava";
import * as supertest from "supertest";
import * as HttpStatus from "http-status";
import * as express from "express";
import * as nats from "nats";

import getApp from "../lib/app";
import Messenger from "../lib/messenger";

interface ISetupSettings {
  app: express.Express;
  request: supertest.SuperTest<supertest.Test>;
}

const setup = (): ISetupSettings => {
  const app = getApp(new Messenger(nats.connect({
    url: `nats://${process.env["NATS_HOST"]}:${process.env["NATS_PORT"]}`
  })));

  return { app, request: supertest(app) };
};

test("Homepage Should return standard greeting", async (t) => {
  const { request } = setup();

  const res = await request.get("/");
  t.is(res.status, HttpStatus.OK);
  t.is(res.text, "Hello, world!");
});

test("Status Should return status information", async (t) => {
  const { request } = setup();

  const tId = setTimeout(() => { throw new Error("Timed out!"); }, 5 * 1000);

  const res = await request.get("/status");
  clearTimeout(tId);

  t.is(res.status, HttpStatus.OK, "Http status is OK");
  console.log("res.text", res.text);
});
