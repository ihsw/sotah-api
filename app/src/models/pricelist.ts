import * as SequelizeStatic from "sequelize";
import { Instance, Sequelize, STRING } from "sequelize";

import { UserModel } from "./user";
import { PricelistEntryModel } from "./pricelist-entry";
import { ProfessionPricelistModel } from "./profession-pricelist";

export type PricelistAttributes = {
  id?: number
  user_id: number
  name: string
};

export interface PricelistInstance extends Instance<PricelistAttributes> {
  id: number;
}

export type PricelistModel = SequelizeStatic.Model<PricelistInstance, PricelistAttributes>;

export const createPricelistModel = (sequelize: Sequelize): PricelistModel => {
  return sequelize.define<PricelistInstance, PricelistAttributes>("pricelist", {
    name: { type: STRING, allowNull: false }
  });
};

export const appendPricelistRelationships = (
  Pricelist: PricelistModel,
  PricelistEntry: PricelistEntryModel,
  User: UserModel,
  ProfessionPricelist: ProfessionPricelistModel
): PricelistModel => {
  Pricelist.belongsTo(User, { foreignKey: "user_id" });
  Pricelist.hasMany(PricelistEntry, { foreignKey: "pricelist_id" });
  Pricelist.hasOne(ProfessionPricelist, { foreignKey: "pricelist_id" });

  return Pricelist;
};

export const withoutEntries = (pricelist: PricelistInstance): PricelistAttributes => {
  const data = pricelist.toJSON();
  delete data["pricelist_entries"];

  return data;
};
