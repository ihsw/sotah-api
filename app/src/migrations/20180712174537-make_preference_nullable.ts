import { QueryInterface, STRING } from "sequelize";

export const up = async (query: QueryInterface) => {
    await query.changeColumn("preferences", "current_region", {
        allowNull: true,
        type: STRING,
    });
};

export const down = async (query: QueryInterface) => {
    await query.changeColumn("preferences", "current_region", {
        allowNull: false,
        type: STRING,
    });
};
