import * as SequelizeStatic from "sequelize";
import { Instance, Sequelize, STRING } from "sequelize";

import { UserModel } from "./user";

export type PreferenceAttributes = {
  id?: number
  user_id: number
  currentRegion: string
};

export interface PreferenceInstance extends Instance<PreferenceAttributes> {
  id: number;
}

export type PreferenceModel = SequelizeStatic.Model<PreferenceInstance, PreferenceAttributes>;

export const createModel = (sequelize: Sequelize): PreferenceModel => {
  return sequelize.define<PreferenceInstance, PreferenceAttributes>("preference", {
    currentRegion: { type: STRING, allowNull: false }
  });
};

export const appendRelationships = (Preference: PreferenceModel, User: UserModel): PreferenceModel => {
  Preference.belongsTo(User, { foreignKey: "user_id" });

  return Preference;
};
