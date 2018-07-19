import * as process from "process";

import test, { TestContext } from "ava";
import * as HTTPStatus from "http-status";
import { v4 as uuidv4 } from "uuid";

import { getLogger } from "../../../lib/logger";
import { setup, getTestHelper, IUserRequest, IUserResponse } from "../../../lib/test-helper";

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

  const responseBody = res.body;
  t.true("user" in responseBody);
  t.true("id" in responseBody.user);
  t.is(typeof responseBody.user.id, "number");

  return responseBody.user;
};

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
    .send({ name: "test", region: "test", realm: "test" })
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
      .send({ name: "test", region: "test", realm: "test" })
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
    .send({ name: "test", region: "test", realm: "test" })
  );
  t.is(res.status, HTTPStatus.CREATED);

  res = await (request
    .put(`/user/pricelists/${res.body.pricelist.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "test2" })
  );
  t.is(res.status, HTTPStatus.OK);
});
