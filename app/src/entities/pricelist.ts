import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { PricelistEntry } from "./pricelist-entry";
import { ProfessionPricelist } from "./profession-pricelist";
import { User } from "./user";

@Entity()
export class Pricelist {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne(() => User, user => user.pricelists)
    @JoinColumn({ name: "user_id" })
    public user: User;

    @OneToOne(() => ProfessionPricelist, professionPricelist => professionPricelist.pricelist)
    public professionPricelist: ProfessionPricelist;

    @OneToMany(() => PricelistEntry, entry => entry.pricelist, {
        eager: true,
    })
    public entries: PricelistEntry[];

    @Column()
    public name: string;
}
