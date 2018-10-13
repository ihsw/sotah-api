import { Instance, INTEGER, Model, Sequelize, STRING } from "sequelize";

import { PricelistEntryModel } from "./pricelist-entry";
import { ProfessionPricelistModel } from "./profession-pricelist";
import { UserModel } from "./user";

export interface IPricelistAttributes {
    id?: number;
    user_id: number;
    name: string;
}

export interface IPricelistInstance extends Instance<IPricelistAttributes> {
    id: number;
}

export type PricelistModel = Model<IPricelistInstance, IPricelistAttributes>;

export const createPricelistModel = (sequelize: Sequelize): PricelistModel => {
    return sequelize.define<IPricelistInstance, IPricelistAttributes>("pricelist", {
        name: { type: STRING, allowNull: false },
        user_id: { type: INTEGER, allowNull: false },
    });
};

export const appendPricelistRelationships = (
    Pricelist: PricelistModel,
    PricelistEntry: PricelistEntryModel,
    User: UserModel,
    ProfessionPricelist: ProfessionPricelistModel,
): PricelistModel => {
    Pricelist.belongsTo(User, { foreignKey: "user_id" });
    Pricelist.hasMany(PricelistEntry, { foreignKey: "pricelist_id" });
    Pricelist.hasOne(ProfessionPricelist, { foreignKey: "pricelist_id" });

    return Pricelist;
};

export const withoutEntries = (pricelist: IPricelistInstance): IPricelistAttributes => {
    const data = pricelist.toJSON();
    delete data["pricelist_entries"];

    return data;
};
