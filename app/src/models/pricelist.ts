import * as SequelizeStatic from "sequelize";
import { Instance, Sequelize, STRING } from "sequelize";

import { UserModel } from "./user";
import { PricelistEntryModel } from "./pricelist-entry";
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

export const createPricelistModel = (sequelize: Sequelize): PricelistModel => {
  return sequelize.define<PricelistInstance, PricelistAttributes>("pricelist", {
    name: { type: STRING, allowNull: false },
    realm: { type: STRING, allowNull: false },
    region: { type: STRING, allowNull: false }
  });
};

export const appendPricelistRelationships = (
  Pricelist: PricelistModel,
  PricelistEntry: PricelistEntryModel,
  User: UserModel
): PricelistModel => {
  Pricelist.belongsTo(User, { foreignKey: "user_id" });
  Pricelist.hasMany(PricelistEntry, { foreignKey: "pricelist_id" });

  return Pricelist;
};
