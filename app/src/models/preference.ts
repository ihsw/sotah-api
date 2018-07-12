import * as SequelizeStatic from "sequelize";
import { Instance, Sequelize, STRING } from "sequelize";

import { UserModel } from "./user";
import { regionName } from "../lib/region";

export type PreferenceAttributes = {
  id?: number
  user_id: number
  current_region: regionName | null
};

export interface PreferenceInstance extends Instance<PreferenceAttributes> {
  id: number;
}

export type PreferenceModel = SequelizeStatic.Model<PreferenceInstance, PreferenceAttributes>;

export const createModel = (sequelize: Sequelize): PreferenceModel => {
  return sequelize.define<PreferenceInstance, PreferenceAttributes>("preference", {
    current_region: { type: STRING, allowNull: true }
  });
};

export const appendRelationships = (Preference: PreferenceModel, User: UserModel): PreferenceModel => {
  Preference.belongsTo(User, { foreignKey: "user_id" });

  return Preference;
};
