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
const { createUser, requestPricelist, createPricelist } = getTestHelper(request);

test("Pricelists crud endpoint Should create a pricelist", async (t) => {
  const password = "test";
  const user = await createUser(t, {
    email: `create-pricelist+${uuidv4()}@test.com`,
    password
  });

  let res = await request.post("/login").send({ email: user.email, password });
  t.is(res.status, HTTPStatus.OK);

  res = await requestPricelist(res.body.token, {
    entries: [{item_id: -1, quantity_modifier: -1}],
    pricelist: { name: "test", realm: "test", region: "test" }
  });
  const { status, body } = res;
  t.is(status, HTTPStatus.CREATED);
  t.is(body.pricelist.name, "test");
  t.true("entries" in body);
  t.is(body.entries.length, 1);
});

test("Pricelists crud endpoint Should return a pricelist", async (t) => {
  const password = "test";
  const user = await createUser(t, {
    email: `get-pricelist+${uuidv4()}@test.com`,
    password
  });

  let res = await request.post("/login").send({ email: user.email, password });
  t.is(res.status, HTTPStatus.OK);

  const { token } = res.body;

  const { pricelist } = await createPricelist(t, res.body.token, {
    entries: [{item_id: -1, quantity_modifier: -1}],
    pricelist: { name: "test", realm: "test", region: "test" }
  });

  res = await (request
    .get(`/user/pricelists/${pricelist.id}`)
    .set("Authorization", `Bearer ${token}`)
  );
  const { status } = res;
  t.is(status, HTTPStatus.OK);
});

test("Pricelists crud endpoint Should return pricelists", async (t) => {
  const password = "test";
  const user = await createUser(t, {
    email: `get-pricelists+${uuidv4()}@test.com`,
    password
  });

  let res = await request.post("/login").send({ email: user.email, password });
  t.is(res.status, HTTPStatus.OK);

  const { token } = res.body;

  const count = 5;
  for (let i = 0; i < count; i++) {
    await createPricelist(t, res.body.token, {
      entries: [{item_id: -1, quantity_modifier: -1}],
      pricelist: { name: "test", realm: "test", region: "test" }
    });
  }

  res = await (request
    .get(`/user/pricelists`)
    .set("Authorization", `Bearer ${token}`)
  );
  const { body, status } = res;
  t.is(status, HTTPStatus.OK);
  t.is(body.pricelists.length, 5);
  t.is(
    body.pricelists.reduce((total, v) => total + v.pricelist_entries.length, 0),
    5
  );
});

test("Pricelists crud endpoint Should update a pricelist", async (t) => {
  const password = "test";
  const user = await createUser(t, {
    email: `update-pricelist+${uuidv4()}@test.com`,
    password
  });

  let res = await request.post("/login").send({ email: user.email, password });
  t.is(res.status, HTTPStatus.OK);

  const { token } = res.body;

  const { pricelist, entries } = await createPricelist(t, res.body.token, {
    entries: [{item_id: -1, quantity_modifier: -1}],
    pricelist: { name: "test", realm: "test", region: "test" }
  });

  res = await (request
    .put(`/user/pricelists/${pricelist.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      entries,
      pricelist: { name: "test2", region: "test2", realm: "test2" }
    })
  );
  t.is(res.status, HTTPStatus.OK);
});
