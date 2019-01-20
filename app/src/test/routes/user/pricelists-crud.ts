import * as process from "process";
import "reflect-metadata";

import test from "ava";
import * as HTTPStatus from "http-status";
import { v4 as uuidv4 } from "uuid";

import { getLogger } from "../../../lib/logger";
import { getTestHelper, setup } from "../../../lib/test-helper";
import { IGetPricelistsResponse } from "../../../types/contracts/user/pricelist-crud";

const helper = async () => {
    const { request } = await setup({
        dbHost: process.env["DB_HOST"] as string,
        isGceEnv: false,
        logger: getLogger(),
        natsHost: process.env["NATS_HOST"] as string,
        natsPort: process.env["NATS_PORT"] as string,
    });
    const { createUser, requestPricelist, createPricelist } = getTestHelper(request);

    return { request, createUser, requestPricelist, createPricelist };
};

test("Pricelists crud endpoint Should create a pricelist", async t => {
    const { createUser, request, requestPricelist } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `create-pricelist+${uuidv4()}@test.com`,
        password,
    });
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    res = await requestPricelist(token, {
        entries: [{ item_id: -1, quantity_modifier: -1 }],
        pricelist: { name: "test", slug: "test" },
    });
    const { status, body } = res;
    t.is(status, HTTPStatus.CREATED);
    t.is(body.pricelist.name, "test");
    t.true("entries" in body);
    t.is(body.entries.length, 1);
});

test("Pricelists crud endpoint Should return a pricelist", async t => {
    const { createUser, request, createPricelist } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `get-pricelist+${uuidv4()}@test.com`,
        password,
    });
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    const { pricelist } = await createPricelist(t, res.body.token, {
        entries: [{ item_id: -1, quantity_modifier: -1 }],
        pricelist: { name: "test", slug: "test" },
    });

    res = await request.get(`/user/pricelists/${pricelist.id}`).set("Authorization", `Bearer ${token}`);
    const { status } = res;
    t.is(status, HTTPStatus.OK);
});

test("Pricelists crud endpoint Should return pricelists", async t => {
    const { createUser, request, createPricelist } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `get-pricelists+${uuidv4()}@test.com`,
        password,
    });
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    const count = 5;
    for (let i = 0; i < count; i++) {
        await createPricelist(t, res.body.token, {
            entries: [{ item_id: -1, quantity_modifier: -1 }],
            pricelist: { name: "test", slug: "test" },
        });
    }

    res = await request.get(`/user/pricelists`).set("Authorization", `Bearer ${token}`);
    const { status } = res;
    const body: IGetPricelistsResponse = res.body;
    t.is(status, HTTPStatus.OK);
    t.is(body.pricelists.length, 5);
    t.is(body.pricelists.reduce((total: number, v) => total + v.pricelist_entries!.length, 0), 5);
});

test("Pricelists crud endpoint Should return pricelists", async t => {
    const { createUser, request, createPricelist } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `get-pricelists+${uuidv4()}@test.com`,
        password,
    });
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    const count = 5;
    for (let i = 0; i < count; i++) {
        await createPricelist(t, res.body.token, {
            entries: [{ item_id: -1, quantity_modifier: -1 }],
            pricelist: { name: "test", slug: "test" },
        });
    }

    res = await request.get("/user/pricelists").set("Authorization", `Bearer ${token}`);
    const { status } = res;
    const body: IGetPricelistsResponse = res.body;
    t.is(status, HTTPStatus.OK);
    t.is(body.pricelists.length, 5);
    t.is(body.pricelists.reduce((total, v) => total + v.pricelist_entries!.length, 0), 5);
});

test("Pricelists crud endpoint Should update a pricelist", async t => {
    const { createUser, request, createPricelist } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `update-pricelist+${uuidv4()}@test.com`,
        password,
    });
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    const { pricelist, entries } = await createPricelist(t, res.body.token, {
        entries: [{ item_id: -1, quantity_modifier: -1 }],
        pricelist: { name: "test", slug: "test" },
    });

    res = await request
        .put(`/user/pricelists/${pricelist.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            entries: entries.map(v => {
                return {
                    ...v,
                    quantity_modifier: v.quantity_modifier + 1,
                };
            }),
            pricelist: { name: "test2", slug: "test2" },
        });
    const { body, status } = res;
    t.is(status, HTTPStatus.OK);
    t.true("entries" in body);
    t.is(body.entries.length, 1);
});

test("Pricelists crud endpoint Should update all entries", async t => {
    const { createUser, request, createPricelist } = await helper();

    const password = "testtest";
    const user = await createUser(t, {
        email: `update-pricelist+${uuidv4()}@test.com`,
        password,
    });
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    const { pricelist, entries } = await createPricelist(t, res.body.token, {
        entries: [{ item_id: -1, quantity_modifier: -1 }],
        pricelist: { name: "test", slug: "test" },
    });

    res = await request
        .put(`/user/pricelists/${pricelist.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            entries: entries.map(v => {
                return {
                    ...v,
                    quantity_modifier: v.quantity_modifier + 5,
                };
            }),
            pricelist: { name: "test2", slug: "test2" },
        });
    const { status, body } = res;
    t.is(status, HTTPStatus.OK);
    t.true("entries" in body);
    t.is(body.entries.length, 1);
    t.is(body.entries[0].quantity_modifier, 4);
});

test("Pricelists crud endpoint Should remove absent entries", async t => {
    const { createUser, request, createPricelist } = await helper();

    // creating the user
    const password = "testtest";
    const user = await createUser(t, {
        email: `update-pricelist+${uuidv4()}@test.com`,
        password,
    });
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    // creating the pricelist
    const { pricelist, entries } = await createPricelist(t, res.body.token, {
        entries: [{ item_id: -1, quantity_modifier: -1 }, { item_id: -1, quantity_modifier: -1 }],
        pricelist: { name: "test", slug: "test" },
    });

    // updating the pricelist with missing entries
    res = await request
        .put(`/user/pricelists/${pricelist.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            entries: entries.slice(0, 1),
            pricelist: { name: "test2", slug: "test2" },
        });
    t.is(res.status, HTTPStatus.OK);

    // fetching the pricelist and verifying that it has fewer entries
    res = await request.get(`/user/pricelists/${pricelist.id}`).set("Authorization", `Bearer ${token}`);
    const { status, body } = res;
    t.is(status, HTTPStatus.OK);
    t.is(body.pricelist.pricelist_entries.length, 1);
});

test("Pricelists crud endpoint Should add new entries", async t => {
    const { createUser, request, createPricelist } = await helper();

    // creating the user
    const password = "testtest";
    const user = await createUser(t, {
        email: `update-pricelist+${uuidv4()}@test.com`,
        password,
    });
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    // creating the pricelist
    const { pricelist, entries } = await createPricelist(t, res.body.token, {
        entries: [{ item_id: -1, quantity_modifier: -1 }, { item_id: -1, quantity_modifier: -1 }],
        pricelist: { name: "test", slug: "test" },
    });

    // updating the pricelist with missing entries
    res = await request
        .put(`/user/pricelists/${pricelist.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            entries: [...entries.slice(0, 1), { id: -1, item_id: -2, quantity_modifier: -2 }],
            pricelist: { name: "test2", slug: "test2" },
        });
    t.is(res.status, HTTPStatus.OK);

    // fetching the pricelist and verifying that it has fewer entries
    res = await request.get(`/user/pricelists/${pricelist.id}`).set("Authorization", `Bearer ${token}`);
    const { status, body } = res;
    t.is(status, HTTPStatus.OK);
    t.is(body.pricelist.pricelist_entries.length, 2);
});
