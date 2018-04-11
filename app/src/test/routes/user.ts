import * as process from "process";

import test, { TestContext } from "ava";
import * as HTTPStatus from "http-status";
import { v4 as uuidv4 } from "uuid";
import * as jwt from "jsonwebtoken";

import { getLogger } from "../../lib/logger";
import { setup, getTestHelper, IUserRequest, IUserResponse } from "../../lib/test-helper";
import { JwtPayload, jwtOptions } from "../../lib/session";

const { request } = setup({
  dbHost: process.env["DB_HOST"] as string,
  logger: getLogger(),
  natsHost: process.env["NATS_HOST"] as string,
  natsPort: process.env["NATS_PORT"] as string
});
const { requestUser } = getTestHelper(request);

const createUser = async (t: TestContext, body: IUserRequest): Promise<IUserResponse> => {
  const res = await requestUser(body);
  t.is(res.status, HTTPStatus.CREATED);
  t.not(String(res.header["content-type"]).match(/^application\/json/), null);
  t.true("id" in res.body);
  t.true(typeof res.body.id === "number");
  t.is(res.body.email, body.email);

  return res.body;
};

test("User creation endpoint Should create a new user", async (t) => {
  const res = await requestUser({
    email: `create-new-user+${uuidv4()}@test.com`,
    password: "test"
  });
  t.is(res.status, HTTPStatus.CREATED);
  t.not(String(res.header["content-type"]).match(/^application\/json/), null);
  t.true("id" in res.body);
  t.is(typeof res.body.id, "number");
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

test("User creation endpoint Should fail on invalid username", async (t) => {
  const res = await request.post("/login").send({ email: `login-fail+${uuidv4()}@test.com` });
  t.is(res.status, HTTPStatus.BAD_REQUEST);
  t.is(res.body.email, "Invalid email!");
});

test("User creation endpoint Should fail on invalid password", async (t) => {
  const user = await createUser(t, {
    email: `login-fail+${uuidv4()}@test.com`,
    password: "test"
  });

  const res = await request.post("/login").send({ email: user.email, password: "test2" });
  t.is(res.status, HTTPStatus.BAD_REQUEST);
  t.is(res.body.email, "Invalid password!");
});

test("User creation endpoint Should succeed", async (t) => {
  const password = "test";
  const user = await createUser(t, {
    email: `login-succeed+${uuidv4()}@test.com`,
    password
  });

  const res = await request.post("/login").send({ email: user.email, password });
  t.is(res.status, HTTPStatus.OK);
  t.true("token" in res.body);
});

test("User creation endpoint Should return jwt when providing valid credentials", async (t) => {
  const password = "test";
  const user = await createUser(t, {
    email: `valid-credentials+${uuidv4()}@test.com`,
    password
  });

  const res = await request.post("/login").send({ email: user.email, password });
  t.is(res.status, HTTPStatus.OK);
  t.true("token" in res.body);
});

test("User creation endpoint Should return logged in user", async (t) => {
  const password = "test";
  const user = await createUser(t, {
    email: `login-succeed+${uuidv4()}@test.com`,
    password
  });

  let res = await request.post("/login").send({ email: user.email, password });
  t.is(res.status, HTTPStatus.OK);

  res = await (request.get("/user").set("Authorization", `Bearer ${res.body.token}`));
  t.is(res.status, HTTPStatus.OK);
  t.is(res.body.id, user.id);
});

test("User creation endpoint Should fail on valid jwt token but invalid payload", async (t) => {
  const token = jwt.sign(
    <JwtPayload>{ data: "-1" },
    jwtOptions.secret,
    { issuer: jwtOptions.issuer, audience: jwtOptions.audience }
  );

  const res = await (request.get("/user").set("Authorization", `Bearer ${token}`));
  t.is(res.status, HTTPStatus.UNAUTHORIZED);
});
