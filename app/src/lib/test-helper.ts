import { Express } from "express";
import * as supertest from "supertest";
import { SuperTest, Test } from "supertest";
import * as nats from "nats";
import { TestContext } from "ava";
import * as HTTPStatus from "http-status";

import { Messenger } from "./messenger";
import { getApp, Options } from "./app";
import { PricelistAttributes } from "../models/pricelist";
import { PricelistEntryAttributes } from "../models/pricelist-entry";

// setup func
type SetupSettings = {
  app: Express
  messenger: Messenger
  request: SuperTest<Test>
};

export const setup = (opts: Options): SetupSettings => {
  const app = getApp(opts);
  const request = supertest(app);
  const messenger = new Messenger(nats.connect({ url: `nats://${opts.natsHost}:${opts.natsPort}` }), opts.logger);

  return { app, messenger, request };
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
  pricelist: PricelistAttributes
  entries: PricelistEntryAttributes[]
}

export interface IPricelistRequest {
  pricelist: {
    name: string
    realm: string
    region: string
  }
  entries: {
    item_id: number
    quantity_modifier: number
  }[]
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
    t.is(res.status, HTTPStatus.CREATED);
    t.not(String(res.header["content-type"]).match(/^application\/json/), null);
    t.is(res.body.pricelist.name, "test");
    t.true("entries" in body);
    t.is(res.body.entries.length, body.entries.length);
  
    return res.body;
  };

  return { requestPricelist, createPricelist };
};

// final test-helper
export const getTestHelper = (request: SuperTest<Test>) => {
  return {
    ...getUserTestHelper(request),
    ...getPricelistTestHelper(request)
  };
};
