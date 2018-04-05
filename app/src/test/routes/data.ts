import * as process from "process";

import { test } from "ava";
import * as HttpStatus from "http-status";

import { getLogger } from "../../lib/logger";
import { setup } from "../../lib/test-helper";
import { IRegion } from "../../lib/region";

const { request, messenger } = setup({
  dbHost: process.env["DB_HOST"] as string,
  logger: getLogger(),
  natsHost: process.env["NATS_HOST"] as string,
  natsPort: process.env["NATS_PORT"] as string
});

test("Regions Should return list of regions", async (t) => {
  const tId = setTimeout(() => { throw new Error("Timed out!"); }, 5 * 1000);

  const res = await request.get("/regions");
  clearTimeout(tId);

  t.is(res.status, HttpStatus.OK, "Http status is OK");
  const regions: IRegion[] = res.body;
  t.true(regions.length > 0);
});

test("Status Should return status information", async (t) => {
  const tId = setTimeout(() => { throw new Error("Timed out!"); }, 5 * 1000);

  const regions = (await messenger.getRegions()).data;
  t.true(regions.length > 0);

  const res = await request.get(`/status/${regions[0].name}`);
  clearTimeout(tId);

  t.is(res.status, HttpStatus.OK, "Http status is OK");
});

test("Status Should return 404 on invalid region name", async (t) => {
  const tId = setTimeout(() => { throw new Error("Timed out!"); }, 5 * 1000);

  const res = await request.get("/status/fdsfgs");
  clearTimeout(tId);

  t.is(res.status, HttpStatus.NOT_FOUND, "Http status is NOT_FOUND");
});
