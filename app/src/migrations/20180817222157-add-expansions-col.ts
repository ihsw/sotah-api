import { QueryInterface, STRING } from "sequelize";

export const up = async (query: QueryInterface) => {
  await query.addColumn("profession_pricelists", "expansion", {
    allowNull: false,
    type: STRING
  });
};

export const down = async (query: QueryInterface) => {
  await query.removeColumn("profession_pricelists", "expansion");
};
