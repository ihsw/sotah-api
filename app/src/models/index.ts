import { Sequelize } from "sequelize";

import {
  UserModel,
  createModel as createUserModel,
  appendRelationships as appendUserRelationships
} from "./user";
import {
  PreferenceModel,
  createModel as createPreferenceModel,
  appendRelationships as appendPreferenceRelationships
} from "./preference";
import {
  PricelistModel,
  createModel as createPricelistModel,
  appendRelationships as appendPricelistRelationships
} from "./pricelist";

export type Models = {
  User: UserModel
  Preference: PreferenceModel
  Pricelist: PricelistModel
};

export const createModels = (sequelize: Sequelize): Models => {
  let User = createUserModel(sequelize);
  let Preference = createPreferenceModel(sequelize);
  let Pricelist = createPricelistModel(sequelize);

  User = appendUserRelationships(User, Preference, Pricelist);
  Preference = appendPreferenceRelationships(Preference, User);
  Pricelist = appendPricelistRelationships(Pricelist, User);

  return { User, Preference, Pricelist };
};
