import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { ExpansionName } from "../types/expansion";
import { ProfessionName } from "../types/profession";
import { Pricelist } from "./pricelist";

@Entity()
export class ProfessionPricelist {
    @PrimaryGeneratedColumn()
    public id: number | undefined;

    @OneToOne(() => Pricelist, pricelist => pricelist.professionPricelist, {
        eager: true,
    })
    @JoinColumn({ name: "pricelist_id" })
    public pricelist: Pricelist | undefined;

    @Column("string")
    public name: ProfessionName;

    @Column("string")
    public expansion: ExpansionName;

    constructor() {
        this.name = "";
        this.expansion = "";
    }
}
