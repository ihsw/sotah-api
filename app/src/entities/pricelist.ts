import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { PricelistEntry } from "./pricelist-entry";
import { ProfessionPricelist } from "./profession-pricelist";
import { User } from "./user";

export interface IPricelistJson {
    id: number;
    name: string;
}

@Entity({ name: "pricelists" })
export class Pricelist {
    @PrimaryGeneratedColumn()
    public id: number | undefined;

    @ManyToOne(() => User, user => user.pricelists, { eager: true })
    @JoinColumn({ name: "user_id" })
    public user: User | undefined;

    @OneToOne(() => ProfessionPricelist, professionPricelist => professionPricelist.pricelist)
    public professionPricelist: ProfessionPricelist | undefined;

    @OneToMany(() => PricelistEntry, entry => entry.pricelist, {
        eager: true,
    })
    public entries: PricelistEntry[] | undefined;

    @Column()
    public name: string;

    constructor() {
        this.name = "";
    }

    public toJson(): IPricelistJson {
        return {
            id: this.id!,
            name: this.name,
        };
    }
}
