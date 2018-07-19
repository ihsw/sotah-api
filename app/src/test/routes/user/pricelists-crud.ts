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
const { createUser } = getTestHelper(request);

test("Pricelists crud endpoint Should create a pricelist", async (t) => {
  const password = "test";
  const user = await createUser(t, {
    email: `create-pricelist+${uuidv4()}@test.com`,
    password
  });

  let res = await request.post("/login").send({ email: user.email, password });
  t.is(res.status, HTTPStatus.OK);

  res = await (request
    .post("/user/pricelists")
    .set("Authorization", `Bearer ${res.body.token}`)
    .send({
      entries: [{item_id: -1, quantity_modifier: -1}],
      pricelist: { name: "test", realm: "test", region: "test" }
    })
  );
  console.log(res.body);
  t.is(res.status, HTTPStatus.CREATED);
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

  res = await (request
    .post("/user/pricelists")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "test", region: "test", realm: "test", entries: [] })
  );
  t.is(res.status, HTTPStatus.CREATED);

  res = await (request
    .get(`/user/pricelists/${res.body.pricelist.id}`)
    .set("Authorization", `Bearer ${token}`)
  );
  t.is(res.status, HTTPStatus.OK);
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
    res = await (request
      .post("/user/pricelists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "test", region: "test", realm: "test", entries: [] })
    );
    t.is(res.status, HTTPStatus.CREATED);
  }

  res = await (request
    .get(`/user/pricelists`)
    .set("Authorization", `Bearer ${token}`)
  );
  t.is(res.status, HTTPStatus.OK);
  t.is(res.body.pricelists.length, 5);
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

  res = await (request
    .post("/user/pricelists")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "test", region: "test", realm: "test", entries: [] })
  );
  t.is(res.status, HTTPStatus.CREATED);

  res = await (request
    .put(`/user/pricelists/${res.body.pricelist.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "test2" })
  );
  t.is(res.status, HTTPStatus.OK);
});
