import * as SequelizeStatic from "sequelize";
import { Instance, Sequelize, INTEGER } from "sequelize";

import { PricelistModel } from "./pricelist";
import { ItemId } from "../lib/auction";

export type PricelistEntryAttributes = {
  id?: number
  item_id: ItemId
  quantity_modifier: number
};

export interface PricelistEntryInstance extends Instance<PricelistEntryAttributes> {
  id: number;
}

export type PricelistEntryModel = SequelizeStatic.Model<PricelistEntryInstance, PricelistEntryAttributes>;

export const createPricelistEntryModel = (sequelize: Sequelize): PricelistEntryModel => {
  return sequelize.define<PricelistEntryInstance, PricelistEntryAttributes>("pricelist", {
    item_id: { type: INTEGER, allowNull: false },
    quantity_modifier: { type: INTEGER, allowNull: false }
  });
};

export const appendPricelistEntryRelationships = (PricelistEntry: PricelistEntryModel, Pricelist: PricelistModel): PricelistEntryModel => {
  PricelistEntry.belongsTo(Pricelist, { foreignKey: "pricelist_id" });

  return PricelistEntry;
};
