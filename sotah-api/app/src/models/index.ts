import { Sequelize } from "sequelize";

import {
  UserModel,
  createModel as createUserModel,
  appendRelationships as appendUserRelationships
} from "./user";
import { PreferenceModel, createPreferenceModel, appendPreferenceRelationships } from "./preference";
import { PricelistModel, createPricelistModel, appendPricelistRelationships } from "./pricelist";
import { PricelistEntryModel, createPricelistEntryModel, appendPricelistEntryRelationships } from "./pricelist-entry";
import { ProfessionPricelistModel, createProfessionPricelistModel, appendProfessionPricelistRelationships } from "./profession-pricelist";

export type Models = {
  User: UserModel
  Preference: PreferenceModel
  Pricelist: PricelistModel
  PricelistEntry: PricelistEntryModel
  ProfessionPricelist: ProfessionPricelistModel
};

export const createModels = (sequelize: Sequelize): Models => {
  let User = createUserModel(sequelize);
  let Preference = createPreferenceModel(sequelize);
  let Pricelist = createPricelistModel(sequelize);
  let PricelistEntry = createPricelistEntryModel(sequelize);
  let ProfessionPricelist = createProfessionPricelistModel(sequelize);

  User = appendUserRelationships(User, Preference, Pricelist);
  Preference = appendPreferenceRelationships(Preference, User);
  Pricelist = appendPricelistRelationships(Pricelist, PricelistEntry, User, ProfessionPricelist);
  PricelistEntry = appendPricelistEntryRelationships(PricelistEntry, Pricelist);
  ProfessionPricelist = appendProfessionPricelistRelationships(ProfessionPricelist, Pricelist);

  return { User, Preference, Pricelist, PricelistEntry, ProfessionPricelist };
};
