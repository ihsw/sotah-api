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
        logger: getLogger(),
        natsHost: process.env["NATS_HOST"] as string,
        natsPort: process.env["NATS_PORT"] as string,
    });
    const { createUser, requestPost, createPost } = getTestHelper(request);

    return { request, createUser, requestPost, createPost };
};

test("Posts crud endpoint Should fail on unauthenticated", async t => {
    const { request } = await helper();

    const res = await request.post("/user/posts").send({ title: "Test" });
    t.is(res.status, HTTPStatus.UNAUTHORIZED);
});

test("Posts crud endpoint Should fail on unauthorized", async t => {
    const { request, createUser } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `create-post-unauthorized+${uuidv4()}@test.com`,
        password,
    });
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    res = await request
        .post("/user/posts")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "test" });
    t.is(res.status, HTTPStatus.UNAUTHORIZED);
});
