import { QueryInterface, INTEGER, STRING } from "sequelize";

export const up = async (query: QueryInterface) => {
  await query.createTable("users", {
    email: {
      allowNull: false,
      type: STRING
    },
    hashed_password: {
      allowNull: false,
      type: STRING
    },
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: INTEGER
    }
  });
};

export const down = async (query: QueryInterface) => {
  await query.dropTable("users");
};
