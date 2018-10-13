import { Instance, Model, Sequelize, STRING } from "sequelize";

import { realmSlug } from "../lib/realm";
import { regionName } from "../lib/region";
import { UserModel } from "./user";

export interface IPreferenceAttributes {
    id?: number;
    user_id: number;
    current_region: regionName | null;
    current_realm: realmSlug | null;
}

export interface IPreferenceInstance extends Instance<IPreferenceAttributes> {
    id: number;
}

export type PreferenceModel = Model<IPreferenceInstance, IPreferenceAttributes>;

export const createPreferenceModel = (sequelize: Sequelize): PreferenceModel => {
    return sequelize.define<IPreferenceInstance, IPreferenceAttributes>("preference", {
        current_realm: { type: STRING, allowNull: true },
        current_region: { type: STRING, allowNull: true },
    });
};

export const appendPreferenceRelationships = (Preference: PreferenceModel, User: UserModel): PreferenceModel => {
    Preference.belongsTo(User, { foreignKey: "user_id" });

    return Preference;
};
