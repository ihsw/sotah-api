import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

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

    @Column()
    public name: string;
}
