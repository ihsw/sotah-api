import { QueryInterface, STRING } from "sequelize";

export const up = async (query: QueryInterface) => {
  await query.addColumn("preferences", "current_realm", {
    allowNull: true,
    type: STRING
  });
};

export const down = async (query: QueryInterface) => {
  await query.removeColumn("preferences", "current_realm");
};
