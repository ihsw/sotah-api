import { QueryInterface, INTEGER } from "sequelize";

import { UserLevel } from "../models/user";

export const up = async (query: QueryInterface) => {
  await query.addColumn("users", "level", {
    allowNull: false,
    defaultValue: UserLevel.Regular,
    type: INTEGER,
  });
};

export const down = async (query: QueryInterface) => {
  await query.removeColumn("users", "level");
};
