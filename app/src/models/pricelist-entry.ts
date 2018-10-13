import { Instance, INTEGER, Model, Sequelize } from "sequelize";

import { ItemId } from "../lib/auction";
import { PricelistModel } from "./pricelist";

export interface IPricelistEntryAttributes {
    id?: number;
    pricelist_id: number;
    item_id: ItemId;
    quantity_modifier: number;
}

export interface IPricelistEntryInstance extends Instance<IPricelistEntryAttributes> {
    id: number;
}

export type PricelistEntryModel = Model<IPricelistEntryInstance, IPricelistEntryAttributes>;

export const createPricelistEntryModel = (sequelize: Sequelize): PricelistEntryModel => {
    return sequelize.define<IPricelistEntryInstance, IPricelistEntryAttributes>("pricelist_entries", {
        item_id: { type: INTEGER, allowNull: false },
        pricelist_id: { type: INTEGER, allowNull: false },
        quantity_modifier: { type: INTEGER, allowNull: false },
    });
};

export const appendPricelistEntryRelationships = (
    PricelistEntry: PricelistEntryModel,
    Pricelist: PricelistModel,
): PricelistEntryModel => {
    PricelistEntry.belongsTo(Pricelist, { foreignKey: "pricelist_id" });

    return PricelistEntry;
};
