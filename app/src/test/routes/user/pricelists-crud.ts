import * as process from "process";

import test from "ava";
import * as HTTPStatus from "http-status";
import { v4 as uuidv4 } from "uuid";

import { getLogger } from "../../../lib/logger";
import { setup } from "../../../lib/test-helper";
import { createUser } from "../user";

const { request } = setup({
  dbHost: process.env["DB_HOST"] as string,
  logger: getLogger(),
  natsHost: process.env["NATS_HOST"] as string,
  natsPort: process.env["NATS_PORT"] as string
});

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
    .send({ name: "test", region: "test", realm: "test" })
  );
  t.is(res.status, HTTPStatus.CREATED);
});
