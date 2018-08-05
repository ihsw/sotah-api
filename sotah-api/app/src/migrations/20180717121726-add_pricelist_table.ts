import { QueryInterface, INTEGER, STRING } from "sequelize";

export const up = async (query: QueryInterface) => {
  await query.createTable("pricelists", {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: INTEGER
    },
    name: {
      allowNull: false,
      type: STRING
    },
    realm: {
      allowNull: false,
      type: STRING
    },
    region: {
      allowNull: false,
      type: STRING
    },
    user_id: {
      allowNull: false,
      references: {
        key: "id",
        model: "users"
      },
      type: INTEGER
    }
  });
};

export const down = async (query: QueryInterface) => {
  await query.dropTable("pricelists");
};
