import * as SequelizeStatic from "sequelize";
import { Instance, Sequelize, STRING } from "sequelize";

import { PricelistModel } from "./pricelist";
import { ProfessionName } from "../lib/profession";

export type ProfessionPricelistAttributes = {
  id?: number
  pricelist_id: number
  name: ProfessionName
};

export interface ProfessionPricelistInstance extends Instance<ProfessionPricelistAttributes> {
  id: number;
}

export type ProfessionPricelistModel = SequelizeStatic.Model<ProfessionPricelistInstance, ProfessionPricelistAttributes>;

export const createProfessionPricelistModel = (sequelize: Sequelize): ProfessionPricelistModel => {
  return sequelize.define<ProfessionPricelistInstance, ProfessionPricelistAttributes>("profession_pricelist", {
    name: { type: STRING, allowNull: false }
  });
};

export const appendProfessionPricelistRelationships = (
  ProfessionPricelist: ProfessionPricelistModel,
  Pricelist: PricelistModel
): ProfessionPricelistModel => {
  ProfessionPricelist.belongsTo(Pricelist, { foreignKey: "pricelist_id" });

  return ProfessionPricelist;
};

export const withoutPricelist = (professionPricelist: ProfessionPricelistInstance): ProfessionPricelistAttributes => {
  const data = professionPricelist.toJSON();
  delete data["pricelist"];

  return data;
};