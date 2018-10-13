import { Instance, INTEGER, Model, Sequelize, STRING } from "sequelize";

import * as jwt from "jsonwebtoken";

import { Messenger } from "../lib/messenger";
import { getJwtOptions, IJwtPayload } from "../lib/session";
import { PreferenceModel } from "./preference";
import { PricelistModel } from "./pricelist";

export enum UserLevel {
    Admin = 60,
    Regular = 5,
}

export interface IUserAttributes {
    id?: number;
    email: string;
    hashed_password: string;
    level: UserLevel;
}

export interface IUserInstance extends Instance<IUserAttributes> {
    id: number;
}

export type UserModel = Model<IUserInstance, IUserAttributes>;

export const createModel = (sequelize: Sequelize): UserModel => {
    return sequelize.define<IUserInstance, IUserAttributes>("user", {
        email: { type: STRING, allowNull: false },
        hashed_password: { type: STRING, allowNull: false },
        level: { type: INTEGER, allowNull: false, defaultValue: UserLevel.Regular },
    });
};

export const appendRelationships = (
    User: UserModel,
    Preference: PreferenceModel,
    Pricelist: PricelistModel,
): UserModel => {
    User.hasOne(Preference, { foreignKey: "user_id" });
    User.hasMany(Pricelist, { foreignKey: "user_id" });

    return User;
};

export const withoutPassword = (user: IUserInstance): IUserAttributes => {
    const data = user.toJSON();
    delete data["hashed_password"];

    return data;
};

export const generateJwtToken = async (user: IUserInstance, messenger: Messenger): Promise<string> => {
    const jwtOptions = await getJwtOptions(messenger);

    return jwt.sign({ data: user.get("id") }, jwtOptions.secret, {
        audience: jwtOptions.audience,
        issuer: jwtOptions.issuer,
    });
};
