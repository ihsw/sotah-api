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

type Models = {
  User: UserModel
  Preference: PreferenceModel
};

export const createModels = (sequelize: Sequelize): Models => {
  let User = createUserModel(sequelize);
  let Preference = createPreferenceModel(sequelize);

  User = appendUserRelationships(User, Preference);
  Preference = appendPreferenceRelationships(Preference, User);

  return { User, Preference };
};
