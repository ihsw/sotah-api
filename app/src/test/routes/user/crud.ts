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

test("User creation endpoint Should return a user", async (t) => {
  const user = await createUser(t, {
    email: `return-new-user+${uuidv4()}@test.com`,
    password: "test"
  });
  const res = await request.get(`/user/${user.id}`);
  t.is(res.status, HTTPStatus.OK);
});

test("User creation endpoint Should error on fetching user by invalid id", async (t) => {
  const res = await request.get("/user/-1");
  t.is(res.status, HTTPStatus.NOT_FOUND);
});

test("User creation endpoint Should delete a user", async (t) => {
  const user = await createUser(t, {
    email: `delete-user+${uuidv4()}@test.com`,
    password: "test"
  });
  const res = await request.delete(`/user/${user.id}`);
  t.is(res.status, HTTPStatus.OK);
  t.not(String(res.header["content-type"]).match(/^application\/json/), null);
});

test("User creation endpoint Should error on deleting user by invalid id", async (t) => {
  const res = await request.delete("/user/-1");
  t.is(res.status, HTTPStatus.NOT_FOUND);
});

test("User creation endpoint Should update a user", async (t) => {
  const user = await createUser(t, {
    email: `update-user+${uuidv4()}@test.com`,
    password: "test"
  });
  const newBody = { email: `update-user+${uuidv4()}@test.com` };
  const res = await request.put(`/user/${user.id}`).send(newBody);
  t.is(res.status, HTTPStatus.OK);
  t.is(res.body.email, newBody.email);
});

test("User creation endpoint Should error on updating a user by invalid id", async (t) => {
  const res = await request.put("/user/-1");
  t.is(res.status, HTTPStatus.NOT_FOUND);
});
