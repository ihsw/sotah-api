import { QueryInterface } from "sequelize";

export const up = async (query: QueryInterface) => {
  await query.addConstraint("users", ["email"], {
    name: "unique_user_email",
    type: "unique"
  });
};

export const down = async (query: QueryInterface) => {
  await query.removeConstraint("users", "unique_user_email");
};
