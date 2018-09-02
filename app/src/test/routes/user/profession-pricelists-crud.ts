import * as process from "process";

import test from "ava";
import * as HTTPStatus from "http-status";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";

import { getLogger } from "../../../lib/logger";
import { setup, getTestHelper } from "../../../lib/test-helper";
import { UserLevel } from "../../../models/user";

const { request, models } = setup({
  dbHost: process.env["DB_HOST"] as string,
  logger: getLogger(),
  natsHost: process.env["NATS_HOST"] as string,
  natsPort: process.env["NATS_PORT"] as string
});
const { createUser, requestProfessionPricelist, createProfessionPricelist } = getTestHelper(request);

test("Profession pricelists crud endpoint Should create a profession-pricelist", async (t) => {
  const password = "testtest";
  const user = await models.User.create({
    email: `create-profession-pricelists+${uuidv4()}@test.com`,
    hashed_password: await bcrypt.hash(password, 10),
    level: UserLevel.Admin
  });
  let res = await request.post("/login").send({ email: user.get("email"), password });
  t.is(res.status, HTTPStatus.OK);
  const { token } = res.body;

  res = await requestProfessionPricelist(token, {
    entries: [{item_id: -1, quantity_modifier: -1}],
    expansion_name: "test-expansion",
    pricelist: { name: "test" },
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

test("Profession pricelists crud endpoint Should delete a profession-pricelist", async (t) => {
  const password = "testtest";
  const user = await models.User.create({
    email: `delete-profession-pricelists+${uuidv4()}@test.com`,
    hashed_password: await bcrypt.hash(password, 10),
    level: UserLevel.Admin
  });
  let res = await request.post("/login").send({ email: user.get("email"), password });
  t.is(res.status, HTTPStatus.OK);
  const { token } = res.body;

  const responseBody = await createProfessionPricelist(t, token, {
    entries: [{item_id: -1, quantity_modifier: -1}],
    expansion_name: "test-expansion",
    pricelist: { name: "test" },
    profession_name: "jewelcrafting"
  });

  res = await request.delete(`/user/profession-pricelists/${responseBody.pricelist.id}`)
    .set("Authorization", `Bearer ${token}`);
  t.is(res.status, HTTPStatus.OK);
});

test("Profession pricelists crud endpoint Should fail on deleting a non-owned profession-pricelist", async (t) => {
  const password = "testtest";
  const user = await models.User.create({
    email: `delete-fail-profession-pricelists+${uuidv4()}@test.com`,
    hashed_password: await bcrypt.hash(password, 10),
    level: UserLevel.Admin
  });
  let res = await request.post("/login").send({ email: user.get("email"), password });
  t.is(res.status, HTTPStatus.OK);
  const { token } = res.body;

  const responseBody = await createProfessionPricelist(t, token, {
    entries: [{item_id: -1, quantity_modifier: -1}],
    expansion_name: "test-expansion",
    pricelist: { name: "test" },
    profession_name: "jewelcrafting"
  });

  const otherUser = await createUser(t, {
    email: `delete-other-pricelist+${uuidv4()}@test.com`,
    password
  });
  res = await request.post("/login").send({ email: otherUser.email, password });
  t.is(res.status, HTTPStatus.OK);
  const { token: otherToken } = res.body;

  res = await request.delete(`/user/profession-pricelists/${responseBody.profession_pricelist.id}`)
    .set("Authorization", `Bearer ${otherToken}`);
  t.is(res.status, HTTPStatus.UNAUTHORIZED);
});