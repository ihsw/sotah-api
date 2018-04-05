import { Express } from "express";
import * as supertest from "supertest";
import { SuperTest, Test } from "supertest";
import * as nats from "nats";

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

  return { requestUser };
};
