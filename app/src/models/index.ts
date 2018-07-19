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
import {
  PricelistEntryModel,
  createModel as createPricelistEntryModel,
  appendRelationships as appendPricelistEntryRelationships
} from "./pricelist-entry";

export type Models = {
  User: UserModel
  Preference: PreferenceModel
  Pricelist: PricelistModel
  PricelistEntry: PricelistEntryModel
};

export const createModels = (sequelize: Sequelize): Models => {
  let User = createUserModel(sequelize);
  let Preference = createPreferenceModel(sequelize);
  let Pricelist = createPricelistModel(sequelize);
  let PricelistEntry = createPricelistEntryModel(sequelize);

  User = appendUserRelationships(User, Preference, Pricelist);
  Preference = appendPreferenceRelationships(Preference, User);
  Pricelist = appendPricelistRelationships(Pricelist, PricelistEntry, User);
  PricelistEntry = appendPricelistEntryRelationships(PricelistEntry, Pricelist);

  return { User, Preference, Pricelist, PricelistEntry };
};
