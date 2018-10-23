import { TestContext } from "ava";
import { Express } from "express";
import * as HTTPStatus from "http-status";
import * as nats from "nats";
import * as supertest from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { Preference } from "../entities/preference";
import { Pricelist } from "../entities/pricelist";
import { PricelistEntry } from "../entities/pricelist-entry";
import { ProfessionPricelist } from "../entities/profession-pricelist";
import { User } from "../entities/user";
import { ICreateUserRequest, ICreateUserResponse } from "../types/contracts/user";
import { ICreatePricelistRequest, ICreatePricelistResponse } from "../types/contracts/user/pricelist-crud";
import {
    ICreateProfessionPricelistRequest,
    ICreateProfessionPricelistResponse,
} from "../types/contracts/user/profession-pricelists-crud";
import { getApp, IOptions } from "./app";
import { Messenger } from "./messenger";

// setup func
interface ISetupSettings {
    app: Express;
    messenger: Messenger;
    dbConn: Connection;
    request: supertest.SuperTest<supertest.Test>;
}

export const setup = async (opts: IOptions): Promise<ISetupSettings> => {
    const app = await getApp(opts);
    const request = supertest(app);
    const messenger = new Messenger(nats.connect({ url: `nats://${opts.natsHost}:${opts.natsPort}` }));
    const dbConn = await createConnection({
        database: "postgres",
        entities: [Preference, Pricelist, PricelistEntry, ProfessionPricelist, User],
        host: opts.dbHost,
        logging: false,
        name: `test-${uuidv4()}`,
        password: "",
        port: 5432,
        synchronize: false,
        type: "postgres",
        username: "postgres",
    });

    return { app, messenger, dbConn, request };
};

// user test-helper
const getUserTestHelper = (request: supertest.SuperTest<supertest.Test>) => {
    const requestUser = (body: ICreateUserRequest) => request.post("/users").send(body);
    const createUser = async (t: TestContext, body: ICreateUserRequest) => {
        const res = await requestUser(body);
        t.is(res.status, HTTPStatus.CREATED);
        t.not(String(res.header["content-type"]).match(/^application\/json/), null);

        const responseBody: ICreateUserResponse = res.body;
        t.true("user" in responseBody);
        t.true("id" in responseBody.user);
        t.is(typeof responseBody.user.id, "number");

        return responseBody.user;
    };

    return { requestUser, createUser };
};

// pricelist test-helper
const getPricelistTestHelper = (request: supertest.SuperTest<supertest.Test>) => {
    const requestPricelist = (token: string, body: ICreatePricelistRequest) => {
        return request
            .post("/user/pricelists")
            .set("Authorization", `Bearer ${token}`)
            .send(body);
    };
    const createPricelist = async (
        t: TestContext,
        token: string,
        body: ICreatePricelistRequest,
    ): Promise<ICreatePricelistResponse> => {
        const res = await requestPricelist(token, body);
        const { status, body: responseBody, header } = res;
        t.is(status, HTTPStatus.CREATED);
        t.not(String(header["content-type"]).match(/^application\/json/), null);

        t.true("pricelist" in responseBody);
        const { pricelist } = responseBody;
        t.is(pricelist.name, body.pricelist.name);

        t.true("entries" in body);
        const { entries } = responseBody;
        t.is(entries.length, body.entries.length);
        t.not(entries[0].id, null);

        return responseBody;
    };

    return { requestPricelist, createPricelist };
};

const getProfessionPricelistTestHelper = (request: supertest.SuperTest<supertest.Test>) => {
    const requestProfessionPricelist = (token: string, body: ICreateProfessionPricelistRequest) => {
        return request
            .post("/user/profession-pricelists")
            .set("Authorization", `Bearer ${token}`)
            .send(body);
    };
    const createProfessionPricelist = async (
        t: TestContext,
        token: string,
        body: ICreateProfessionPricelistRequest,
    ): Promise<ICreateProfessionPricelistResponse> => {
        const res = await requestProfessionPricelist(token, body);
        const { status, body: responseBody, header } = res;
        t.is(status, HTTPStatus.CREATED);
        t.not(String(header["content-type"]).match(/^application\/json/), null);

        t.true("profession_pricelist" in responseBody);
        const { profession_pricelist } = responseBody;
        t.is(profession_pricelist.name, body.profession_name);

        t.true("pricelist" in responseBody);
        const { pricelist } = responseBody;
        t.is(pricelist.name, body.pricelist.name);

        t.true("entries" in responseBody);
        const { entries } = responseBody;
        t.is(entries.length, body.entries.length);
        t.not(entries[0].id, null);

        return responseBody;
    };

    return { requestProfessionPricelist, createProfessionPricelist };
};

// final test-helper
export const getTestHelper = (request: supertest.SuperTest<supertest.Test>) => {
    return {
        ...getUserTestHelper(request),
        ...getPricelistTestHelper(request),
        ...getProfessionPricelistTestHelper(request),
    };
};
