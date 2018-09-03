import * as SequelizeStatic from "sequelize";
import { Instance, Sequelize, STRING, INTEGER } from "sequelize";
import * as jwt from "jsonwebtoken";

import { JwtPayload, getJwtOptions } from "../lib/session";
import { Messenger } from "../lib/messenger";
import { PreferenceModel } from "./preference";
import { PricelistModel } from "./pricelist";

export enum UserLevel {
  Admin = 60,
  Regular = 5
}

export type UserAttributes = {
  id?: number
  email: string
  hashed_password: string
  level: UserLevel
};

export interface UserInstance extends Instance<UserAttributes> {
  id: number;
}

export type UserModel = SequelizeStatic.Model<UserInstance, UserAttributes>;

export const createModel = (sequelize: Sequelize): UserModel => {
  return sequelize.define<UserInstance, UserAttributes>("user", {
    email: { type: STRING, allowNull: false },
    hashed_password: { type: STRING, allowNull: false },
    level: { type: INTEGER, allowNull: false, defaultValue: UserLevel.Regular }
  });
};

export const appendRelationships = (
  User: UserModel,
  Preference: PreferenceModel,
  Pricelist: PricelistModel
): UserModel => {
  User.hasOne(Preference, { foreignKey: "user_id" });
  User.hasMany(Pricelist, { foreignKey: "user_id" });

  return User;
};

export const withoutPassword = (user: UserInstance): UserAttributes => {
  const data = user.toJSON();
  delete data["hashed_password"];

  return data;
};

export const generateJwtToken = async (user: UserInstance, messenger: Messenger): Promise<string> => {
  const jwtOptions = await getJwtOptions(messenger);

  return jwt.sign(
    <JwtPayload>{ data: user.get("id") },
    jwtOptions.secret,
    { issuer: jwtOptions.issuer, audience: jwtOptions.audience }
  );
};
