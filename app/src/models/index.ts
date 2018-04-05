import { Sequelize } from "sequelize";

import {
  UserModel,
  createModel as createUserModel
} from "./user";

type Models = {
  User: UserModel
};

export const createModels = (sequelize: Sequelize): Models => {
  let User = createUserModel(sequelize);

  return { User };
};
