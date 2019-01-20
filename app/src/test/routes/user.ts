import * as process from "process";
import "reflect-metadata";

import test from "ava";
import * as HTTPStatus from "http-status";
import * as jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { getLogger } from "../../lib/logger";
import { getJwtOptions } from "../../lib/session";
import { getTestHelper, setup } from "../../lib/test-helper";

const helper = async () => {
    const { request, messenger } = await setup({
        dbHost: process.env["DB_HOST"] as string,
        isGceEnv: false,
        logger: getLogger(),
        natsHost: process.env["NATS_HOST"] as string,
        natsPort: process.env["NATS_PORT"] as string,
    });
    const { requestUser, createUser } = getTestHelper(request);

    return { request, messenger, requestUser, createUser };
};

test("User creation endpoint Should create a new user", async t => {
    const { requestUser } = await helper();

    const res = await requestUser({
        email: `create-new-user+${uuidv4()}@test.com`,
        password: "testtest",
    });
    t.is(res.status, HTTPStatus.CREATED);
    t.not(String(res.header["content-type"]).match(/^application\/json/), null);

    const body = res.body;
    t.true("token" in body);
    t.is(typeof body.token, "string");
});

test("User creation endpoint Should fail on invalid username", async t => {
    const { request } = await helper();

    const res = await request.post("/login").send({ email: `login-fail+${uuidv4()}@test.com` });
    t.is(res.status, HTTPStatus.BAD_REQUEST);
    t.is(res.body.email, "Invalid email!");
});

test("User creation endpoint Should fail on invalid password", async t => {
    const { createUser, request } = await helper();

    const user = await createUser(t, {
        email: `login-fail+${uuidv4()}@test.com`,
        password: "testtest",
    });

    const res = await request.post("/login").send({ email: user.email, password: "test2" });
    t.is(res.status, HTTPStatus.BAD_REQUEST);
    t.is(res.body.password, "Invalid password!");
});

test("User creation endpoint Should succeed", async t => {
    const { createUser, request } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `login-succeed+${uuidv4()}@test.com`,
        password,
    });

    const res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    t.true("token" in res.body);
});

test("User creation endpoint Should fail on duplicate user", async t => {
    const { createUser, request } = await helper();

    const user = await createUser(t, {
        email: `login-fail+${uuidv4()}@test.com`,
        password: "testtest",
    });

    const res = await request.post("/users").send({ email: user.email, password: "testtest" });
    t.is(res.status, HTTPStatus.BAD_REQUEST);
    t.deepEqual(res.body, { email: "Email is already in use!" });
});

test("User creation endpoint Should return jwt when providing valid credentials", async t => {
    const { createUser, request } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `valid-credentials+${uuidv4()}@test.com`,
        password,
    });

    const res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    t.true("token" in res.body);
});

test("User creation endpoint Should return logged in user", async t => {
    const { createUser, request } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `login-succeed+${uuidv4()}@test.com`,
        password,
    });

    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);

    res = await request.get("/user").set("Authorization", `Bearer ${res.body.token}`);
    t.is(res.status, HTTPStatus.OK);
    t.is(res.body.id, user.id);
});

test("User creation endpoint Should fail on valid jwt token but invalid payload", async t => {
    const { messenger, request } = await helper();

    const jwtOptions = await getJwtOptions(messenger);

    const token = jwt.sign({ data: "-1" }, jwtOptions.secret, {
        audience: jwtOptions.audience,
        issuer: jwtOptions.issuer,
    });

    const res = await request.get("/user").set("Authorization", `Bearer ${token}`);
    t.is(res.status, HTTPStatus.UNAUTHORIZED);
});
