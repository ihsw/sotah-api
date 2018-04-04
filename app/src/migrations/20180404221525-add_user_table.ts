import { QueryInterface, INTEGER, STRING } from "sequelize";

export const up = async (query: QueryInterface) => {
  await query.createTable("users", {
    email: STRING,
    hashed_password: STRING,
    id: INTEGER
  });
};

export const down = async (query: QueryInterface) => {
  await query.dropTable("users");
};
