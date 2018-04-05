import * as SequelizeStatic from "sequelize";
import { Instance, Sequelize, STRING } from "sequelize";

export type UserAttributes = {
  id?: number
  email: string
  hashed_password: string
};

export interface UserInstance extends Instance<UserAttributes> {
  id: number;
}

export type UserModel = SequelizeStatic.Model<UserInstance, UserAttributes>;

export const createModel = (sequelize: Sequelize): UserModel => {
  return sequelize.define<UserInstance, UserAttributes>("user", {
    email: { type: STRING, allowNull: false },
    hashed_password: { type: STRING, allowNull: false }
  });
};

export const appendRelationships = (User: UserModel): UserModel => {
  return User;
};

export const withoutPassword = (user: UserInstance): UserAttributes => {
  const data = user.toJSON();
  delete data["hashed_password"];

  return data;
};
