import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { ItemId } from "../lib/auction";
import { Pricelist } from "./pricelist";

@Entity()
export class PricelistEntry {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne(() => Pricelist, pricelist => pricelist.entries)
    @JoinColumn({ name: "pricelist_id" })
    public pricelist: Pricelist;

    @Column("int")
    public itemId: ItemId;

    @Column("int")
    public quantityModifier: number;
}
