import { INTEGER, QueryInterface, STRING } from "sequelize";

export const up = async (query: QueryInterface) => {
    await query.createTable("profession_pricelists", {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: INTEGER,
        },
        name: {
            allowNull: false,
            type: STRING,
        },
        pricelist_id: {
            allowNull: false,
            references: {
                key: "id",
                model: "pricelists",
            },
            type: INTEGER,
        },
    });
    await query.addIndex("profession_pricelists", ["name"], { indexName: "profession_pricelists_name_idx" });
};

export const down = async (query: QueryInterface) => {
    await query.removeIndex("profession_pricelists", "profession_pricelists_name_idx");
    await query.dropTable("profession_pricelists");
};
