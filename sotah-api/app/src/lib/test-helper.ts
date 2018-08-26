import { Express } from "express";
import * as supertest from "supertest";
import { SuperTest, Test } from "supertest";
import * as nats from "nats";
import { TestContext } from "ava";
import * as HTTPStatus from "http-status";
import * as Sequelize from "sequelize";

import { Messenger } from "./messenger";
import { getApp, Options } from "./app";
import { PricelistAttributes } from "../models/pricelist";
import { PricelistEntryAttributes } from "../models/pricelist-entry";
import { ProfessionPricelistAttributes } from "../models/profession-pricelist";
import { ProfessionName } from "./profession";
import { createModels, Models } from "../models";
import { ExpansionName } from "./expansion";

// setup func
type SetupSettings = {
  app: Express
  messenger: Messenger
  request: SuperTest<Test>
  models: Models
};

export const setup = (opts: Options): SetupSettings => {
  const app = getApp(opts);
  const request = supertest(app);
  const messenger = new Messenger(nats.connect({ url: `nats://${opts.natsHost}:${opts.natsPort}` }), opts.logger);
  const sequelize = new Sequelize("postgres", "postgres", "", <Sequelize.Options>{
    define: { timestamps: false },
    dialect: "postgres",
    host: opts.dbHost,
    logging: false,
    operatorsAliases: false
  });
  const models = createModels(sequelize);

  return { app, messenger, request, models };
};

// user test-helper
export interface IUserResponse {
  id: number;
  email: string;
}

export interface IUserRequest {
  email: string;
  password: string;
}

const getUserTestHelper = (request: SuperTest<Test>) => {
  const requestUser = (body: IUserRequest) => request.post("/users").send(body);
  const createUser = async (t: TestContext, body: IUserRequest) => {
    const res = await requestUser(body);
    t.is(res.status, HTTPStatus.CREATED);
    t.not(String(res.header["content-type"]).match(/^application\/json/), null);

    const responseBody = res.body;
    t.true("user" in responseBody);
    t.true("id" in responseBody.user);
    t.is(typeof responseBody.user.id, "number");

    return responseBody.user;
  };

  return { requestUser, createUser };
};

// pricelist test-helper
export interface IPricelistResponse {
  pricelist: PricelistAttributes;
  entries: PricelistEntryAttributes[];
}

export interface IPricelistRequest {
  pricelist: {
    name: string
  };
  entries: {
    item_id: number
    quantity_modifier: number
  }[];
}

const getPricelistTestHelper = (request: SuperTest<Test>) => {
  const requestPricelist = (token: string, body: IPricelistRequest) => {
    return request
      .post("/user/pricelists")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
  };
  const createPricelist = async (t: TestContext, token: string, body: IPricelistRequest): Promise<IPricelistResponse> => {
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

// profession-pricelist test-helper
export interface IProfessionPricelistResponse {
  profession_pricelist: ProfessionPricelistAttributes;
  pricelist: PricelistAttributes;
  entries: PricelistEntryAttributes[];
}

export interface IProfessionPricelistRequest extends IPricelistRequest {
  profession_name: ProfessionName;
  expansion_name: ExpansionName;
}

const getProfessionPricelistTestHelper = (request: SuperTest<Test>) => {
  const requestProfessionPricelist = (token: string, body: IProfessionPricelistRequest) => {
    return request
      .post("/user/profession-pricelists")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
  };
  const createProfessionPricelist = async (
    t: TestContext, token: string,
    body: IProfessionPricelistRequest
  ): Promise<IProfessionPricelistResponse> => {
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
export const getTestHelper = (request: SuperTest<Test>) => {
  return {
    ...getUserTestHelper(request),
    ...getPricelistTestHelper(request),
    ...getProfessionPricelistTestHelper(request)
  };
};
