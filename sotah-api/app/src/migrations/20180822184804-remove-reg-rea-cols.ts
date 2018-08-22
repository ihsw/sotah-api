import { QueryInterface, STRING } from "sequelize";

export const up = async (query: QueryInterface) => {
  await query.removeColumn("pricelists", "realm");
  await query.removeColumn("pricelists", "region");
};

export const down = async (query: QueryInterface) => {
  await query.addColumn("pricelists", "realm", {
    allowNull: true,
    type: STRING
  });
  await query.addColumn("pricelists", "region", {
    allowNull: true,
    type: STRING
  });
};
