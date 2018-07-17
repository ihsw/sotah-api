import * as SequelizeStatic from "sequelize";
import { Instance, Sequelize, STRING } from "sequelize";

import { UserModel } from "./user";
import { regionName } from "../lib/region";
import { realmSlug } from "../lib/realm";

export type PricelistAttributes = {
  id?: number
  user_id: number
  name: string
  region: regionName
  realm: realmSlug
};

export interface PricelistInstance extends Instance<PricelistAttributes> {
  id: number;
}

export type PricelistModel = SequelizeStatic.Model<PricelistInstance, PricelistAttributes>;

export const createModel = (sequelize: Sequelize): PricelistModel => {
  return sequelize.define<PricelistInstance, PricelistAttributes>("pricelist", {
    name: { type: STRING, allowNull: true },
    realm: { type: STRING, allowNull: true },
    region: { type: STRING, allowNull: true }
  });
};

export const appendRelationships = (Pricelist: PricelistModel, User: UserModel): PricelistModel => {
  Pricelist.belongsTo(User, { foreignKey: "user_id" });

  return Pricelist;
};
