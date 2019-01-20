import * as process from "process";
import "reflect-metadata";

import test from "ava";
import * as bcrypt from "bcrypt";
import * as HTTPStatus from "http-status";
import { v4 as uuidv4 } from "uuid";

import { User } from "../../../entities/user";
import { getLogger } from "../../../lib/logger";
import { getTestHelper, setup } from "../../../lib/test-helper";
import { UserLevel } from "../../../types/entities";

const helper = async () => {
    const { request, dbConn } = await setup({
        dbHost: process.env["DB_HOST"] as string,
        isGceEnv: false,
        logger: getLogger(),
        natsHost: process.env["NATS_HOST"] as string,
        natsPort: process.env["NATS_PORT"] as string,
    });
    const { createUser, requestProfessionPricelist, createProfessionPricelist } = getTestHelper(request);

    return { request, dbConn, createUser, requestProfessionPricelist, createProfessionPricelist };
};

test("Profession pricelists crud endpoint Should create a profession-pricelist", async t => {
    const { dbConn, request, requestProfessionPricelist } = await helper();

    const password = "testtest";
    const user = await (async () => {
        const out = new User();
        out.email = `create-profession-pricelists+${uuidv4()}@test.com`;
        out.hashedPassword = await bcrypt.hash(password, 10);
        out.level = UserLevel.Admin;

        return dbConn.manager.save(out);
    })();
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    res = await requestProfessionPricelist(token, {
        entries: [{ item_id: -1, quantity_modifier: -1 }],
        expansion_name: "test-expansion",
        pricelist: { name: "test", slug: "test" },
        profession_name: "jewelcrafting",
    });
    const { status, body } = res;
    t.is(status, HTTPStatus.CREATED);

    t.true("profession_pricelist" in body);
    t.is(body.profession_pricelist.name, "jewelcrafting");

    t.true("pricelist" in body);
    t.is(body.pricelist.name, "test");

    t.true("entries" in body);
    t.is(body.entries.length, 1);
});

test("Profession pricelists crud endpoint Should delete a profession-pricelist", async t => {
    const { dbConn, request, createProfessionPricelist } = await helper();

    const password = "testtest";
    const user = await (async () => {
        const out = new User();
        out.email = `delete-profession-pricelists+${uuidv4()}@test.com`;
        out.hashedPassword = await bcrypt.hash(password, 10);
        out.level = UserLevel.Admin;

        return dbConn.manager.save(out);
    })();
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    const responseBody = await createProfessionPricelist(t, token, {
        entries: [{ item_id: -1, quantity_modifier: -1 }],
        expansion_name: "test-expansion",
        pricelist: { name: "test", slug: "test" },
        profession_name: "jewelcrafting",
    });

    res = await request
        .delete(`/user/profession-pricelists/${responseBody.profession_pricelist.pricelist.id}`)
        .set("Authorization", `Bearer ${token}`);
    t.is(res.status, HTTPStatus.OK);
});

test("Profession pricelists crud endpoint Should fail on deleting a non-owned profession-pricelist", async t => {
    const { dbConn, request, createProfessionPricelist, createUser } = await helper();

    const password = "testtest";
    const user = await (async () => {
        const out = new User();
        out.email = `delete-fail-profession-pricelists+${uuidv4()}@test.com`;
        out.hashedPassword = await bcrypt.hash(password, 10);
        out.level = UserLevel.Admin;

        return dbConn.manager.save(out);
    })();
    let res = await request.post("/login").send({ email: user.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token } = res.body;

    const responseBody = await createProfessionPricelist(t, token, {
        entries: [{ item_id: -1, quantity_modifier: -1 }],
        expansion_name: "test-expansion",
        pricelist: { name: "test", slug: "test" },
        profession_name: "jewelcrafting",
    });

    const otherUser = await createUser(t, {
        email: `delete-other-pricelist+${uuidv4()}@test.com`,
        password,
    });
    res = await request.post("/login").send({ email: otherUser.email, password });
    t.is(res.status, HTTPStatus.OK);
    const { token: otherToken } = res.body;

    res = await request
        .delete(`/user/profession-pricelists/${responseBody.profession_pricelist.id}`)
        .set("Authorization", `Bearer ${otherToken}`);
    t.is(res.status, HTTPStatus.UNAUTHORIZED);
});
