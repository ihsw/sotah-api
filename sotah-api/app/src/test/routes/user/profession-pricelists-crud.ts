import * as process from "process";

import test from "ava";
import * as HTTPStatus from "http-status";
import { v4 as uuidv4 } from "uuid";

import { getLogger } from "../../../lib/logger";
import { setup, getTestHelper } from "../../../lib/test-helper";

const { request } = setup({
  dbHost: process.env["DB_HOST"] as string,
  logger: getLogger(),
  natsHost: process.env["NATS_HOST"] as string,
  natsPort: process.env["NATS_PORT"] as string
});
const { createUser, requestProfessionPricelist } = getTestHelper(request);

test.only("Profession pricelists crud endpoint Should create a profession-pricelist", async (t) => {
  const password = "testtest";
  const user = await createUser(t, {
    email: `create-profession-pricelist+${uuidv4()}@test.com`,
    password
  });
  let res = await request.post("/login").send({ email: user.email, password });
  t.is(res.status, HTTPStatus.OK);
  const { token } = res.body;

  res = await requestProfessionPricelist(token, {
    entries: [{item_id: -1, quantity_modifier: -1}],
    pricelist: { name: "test", realm: "test", region: "test" },
    profession_name: "jewelcrafting"
  });
  const { status, body } = res;
  t.is(status, HTTPStatus.CREATED);

  t.true("profession_pricelist" in body);
  t.is(body.profession_pricelist.name, "jewelcrafting");

  t.true("pricelist" in body);
  t.is(body.pricelist.name, "test");

  t.true("entries" in body);
  t.is(body.entries.length, 1);
});
