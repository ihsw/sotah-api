import { Sequelize } from "sequelize";

import {
  UserModel,
  createModel as createUserModel,
  appendRelationships as appendUserRelationships
} from "./user";

type Models = {
  User: UserModel
};

export const createModels = (sequelize: Sequelize): Models => {
  let User = createUserModel(sequelize);
  User = appendUserRelationships(User);

  return { User };
};
