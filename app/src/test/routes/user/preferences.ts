import * as process from "process";
import "reflect-metadata";

import test from "ava";
import * as HTTPStatus from "http-status";
import { v4 as uuidv4 } from "uuid";

import { getLogger } from "../../../lib/logger";
import { getTestHelper, setup } from "../../../lib/test-helper";

const helper = async () => {
    const { request } = await setup({
        dbHost: process.env["DB_HOST"] as string,
        isGceEnv: false,
        logger: getLogger(),
        natsHost: process.env["NATS_HOST"] as string,
        natsPort: process.env["NATS_PORT"] as string,
    });
    const { createUser } = getTestHelper(request);

    return { request, createUser };
};

test("User creation endpoint Should return not found on existing user but no preferences", async t => {
    const { createUser, request } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `no-preferences+${uuidv4()}@test.com`,
        password,
    });

    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);

    res = await request.get("/user/preferences").set("Authorization", `Bearer ${res.body.token}`);
    t.is(res.status, HTTPStatus.NOT_FOUND);
});

test("User creation endpoint Should create preferences", async t => {
    const { createUser, request } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `create-preference+${uuidv4()}@test.com`,
        password,
    });

    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);

    const { token } = res.body;

    res = await request
        .post("/user/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({ current_region: "test" });
    t.is(res.status, HTTPStatus.CREATED);
});

test("User creation endpoint Should return preferences", async t => {
    const { createUser, request } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `create-preference+${uuidv4()}@test.com`,
        password,
    });

    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);

    const { token } = res.body;

    res = await request
        .post("/user/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({ current_region: "test" });
    t.is(res.status, HTTPStatus.CREATED);

    res = await request.get("/user/preferences").set("Authorization", `Bearer ${token}`);
    t.is(res.status, HTTPStatus.OK);
    t.is(res.body.preference.current_region, "test");
});

test("User creation endpoint Should create blank preferences", async t => {
    const { createUser, request } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `create-blank-preference+${uuidv4()}@test.com`,
        password,
    });

    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);

    const { token } = res.body;

    res = await request
        .post("/user/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({});
    t.is(res.status, HTTPStatus.CREATED);
});

test("User creation endpoint Should update preferences", async t => {
    const { createUser, request } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `create-preference+${uuidv4()}@test.com`,
        password,
    });

    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);

    const { token } = res.body;

    res = await request
        .post("/user/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({ current_region: "test" });
    t.is(res.status, HTTPStatus.CREATED);

    res = await request
        .put("/user/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({ current_region: "test2" });
    t.is(res.status, HTTPStatus.OK);
});
