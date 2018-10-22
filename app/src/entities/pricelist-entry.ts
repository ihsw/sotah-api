import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { ItemId } from "../types/item";
import { Pricelist } from "./pricelist";

@Entity({ name: "pricelist_entries" })
export class PricelistEntry {
    @PrimaryGeneratedColumn()
    public id: number | undefined;

    @ManyToOne(() => Pricelist, pricelist => pricelist.entries)
    @JoinColumn({ name: "pricelist_id" })
    public pricelist: Pricelist | undefined;

    @Column("int")
    public itemId: ItemId;

    @Column("int")
    public quantityModifier: number;

    constructor() {
        this.itemId = -1;
        this.quantityModifier = -1;
    }
}
