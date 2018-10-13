import { Instance, INTEGER, Model, Sequelize, STRING } from "sequelize";

import { ExpansionName } from "../lib/expansion";
import { ProfessionName } from "../lib/profession";
import { PricelistModel } from "./pricelist";

export interface IProfessionPricelistAttributes {
    id?: number;
    pricelist_id: number;
    name: ProfessionName;
    expansion: ExpansionName;
}

export interface IProfessionPricelistInstance extends Instance<IProfessionPricelistAttributes> {
    id: number;
}

export type ProfessionPricelistModel = Model<IProfessionPricelistInstance, IProfessionPricelistAttributes>;

export const createProfessionPricelistModel = (sequelize: Sequelize): ProfessionPricelistModel => {
    return sequelize.define<IProfessionPricelistInstance, IProfessionPricelistAttributes>("profession_pricelist", {
        expansion: { type: STRING, allowNull: false },
        name: { type: STRING, allowNull: false },
        pricelist_id: { type: INTEGER, allowNull: false },
    });
};

export const appendProfessionPricelistRelationships = (
    ProfessionPricelist: ProfessionPricelistModel,
    Pricelist: PricelistModel,
): ProfessionPricelistModel => {
    ProfessionPricelist.belongsTo(Pricelist, { foreignKey: "pricelist_id" });

    return ProfessionPricelist;
};

export const withoutPricelist = (professionPricelist: IProfessionPricelistInstance): IProfessionPricelistAttributes => {
    const data = professionPricelist.toJSON();
    delete data["pricelist"];

    return data;
};
