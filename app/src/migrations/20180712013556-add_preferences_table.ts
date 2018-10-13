import { INTEGER, QueryInterface, STRING } from "sequelize";

export const up = async (query: QueryInterface) => {
    await query.createTable("preferences", {
        current_region: {
            allowNull: false,
            type: STRING,
        },
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: INTEGER,
        },
        user_id: {
            allowNull: false,
            references: {
                key: "id",
                model: "users",
            },
            type: INTEGER,
        },
    });
};

export const down = async (query: QueryInterface) => {
    await query.dropTable("preferences");
};
