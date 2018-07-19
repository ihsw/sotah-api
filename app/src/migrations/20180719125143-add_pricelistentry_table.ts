import { QueryInterface, INTEGER } from "sequelize";

export const up = async (query: QueryInterface) => {
  await query.createTable("pricelist_entries", {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: INTEGER
    },
    item_id: {
      allowNull: false,
      type: INTEGER
    },
    pricelist_id: {
      allowNull: false,
      references: {
        key: "id",
        model: "pricelists"
      },
      type: INTEGER
    },
    quantity_modifier: {
      allowNull: false,
      type: INTEGER
    }
  });
};

export const down = async (query: QueryInterface) => {
  await query.dropTable("pricelist_entries");
};
