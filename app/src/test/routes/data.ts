import * as process from "process";
import "reflect-metadata";

import { test } from "ava";
import * as HttpStatus from "http-status";

import { getLogger } from "../../lib/logger";
import { setup } from "../../lib/test-helper";
import { SortDirection, SortKind } from "../../types";
import { IRegion } from "../../types/region";

const helper = async () => {
    const { request, messenger } = await setup({
        dbHost: process.env["DB_HOST"] as string,
        isGceEnv: false,
        logger: getLogger(),
        natsHost: process.env["NATS_HOST"] as string,
        natsPort: process.env["NATS_PORT"] as string,
    });

    return { request, messenger };
};

test("Regions Should return list of regions", async t => {
    const { request } = await helper();

    const tId = setTimeout(() => {
        throw new Error("Timed out!");
    }, 5 * 1000);

    const res = await request.get("/regions");
    clearTimeout(tId);

    t.is(res.status, HttpStatus.OK, "Http status is OK");
    const regions: IRegion[] = res.body;
    t.true(regions.length > 0);
});

test("Status Should return status information", async t => {
    const { request, messenger } = await helper();

    const tId = setTimeout(() => {
        throw new Error("Timed out!");
    }, 5 * 1000);

    const { regions } = (await messenger.getBoot()).data!;
    t.true(regions.length > 0);

    const res = await request.get(`/region/${regions[0].name}/realms`);
    clearTimeout(tId);

    t.is(res.status, HttpStatus.OK, "Http status is OK");
});

test("Status Should return auction information", async t => {
    const { request, messenger } = await helper();

    const tId = setTimeout(() => {
        throw new Error("Timed out!");
    }, 5 * 1000);

    const { regions } = (await messenger.getBoot()).data!;
    const [region] = regions;
    const [realm] = (await messenger.getStatus(region.name)).data!.realms;
    const res = await request.post(`/region/${region.name}/realm/${realm.slug}/auctions`).send({
        count: 10,
        page: 0,
        sortDirection: SortDirection.none,
        sortKind: SortKind.none,
    });
    clearTimeout(tId);

    t.is(res.status, HttpStatus.OK, "Http status is OK");
});

test("Status Should return return 404 on invalid region name in auctions", async t => {
    const { request } = await helper();

    const tId = setTimeout(() => {
        throw new Error("Timed out!");
    }, 5 * 1000);

    const res = await request.post("/region/fdsfgs/realm/fdsfgs/auctions");
    clearTimeout(tId);

    t.is(res.status, HttpStatus.NOT_FOUND, "Http status is NOT_FOUND");
});

test("Status Should return 400 on invalid count", async t => {
    const { request, messenger } = await helper();

    const tId = setTimeout(() => {
        throw new Error("Timed out!");
    }, 5 * 1000);

    const { regions } = (await messenger.getBoot()).data!;
    const [region] = regions;
    const [realm] = (await messenger.getStatus(region.name)).data!.realms;
    const res = await request.post(`/region/${region.name}/realm/${realm.slug}/auctions`).send({ count: 0 });
    clearTimeout(tId);

    t.is(res.status, HttpStatus.BAD_REQUEST);
    t.deepEqual(res.body, { error: "Count must be >0" });
});

test("Status Should return 404 on invalid region name", async t => {
    const { request } = await helper();

    const tId = setTimeout(() => {
        throw new Error("Timed out!");
    }, 5 * 1000);

    const res = await request.get("/region/fdsfgs/realms");
    clearTimeout(tId);

    t.is(res.status, HttpStatus.NOT_FOUND, "Http status is NOT_FOUND");
});
