import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { ExpansionName } from "../lib/expansion";
import { ProfessionName } from "../lib/profession";
import { Pricelist } from "./pricelist";

@Entity()
export class ProfessionPricelist {
    @PrimaryGeneratedColumn()
    public id: number;

    @OneToOne(() => Pricelist, pricelist => pricelist.professionPricelist, {
        eager: true,
    })
    @JoinColumn({ name: "pricelist_id" })
    public pricelist: Pricelist;

    @Column("string")
    public name: ProfessionName;

    @Column("string")
    public expansion: ExpansionName;
}
