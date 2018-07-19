import { Express } from "express";
import * as supertest from "supertest";
import { SuperTest, Test } from "supertest";
import * as nats from "nats";
import { TestContext } from "ava";
import * as HTTPStatus from "http-status";

import { Messenger } from "./messenger";
import { getApp, Options } from "./app";


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

export interface IUserResponse {
  id: number;
  email: string;
}

export interface IUserRequest {
  email: string;
  password: string;
}

export const getTestHelper = (request: SuperTest<Test>) => {
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
