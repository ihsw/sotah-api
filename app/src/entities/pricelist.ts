import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { User } from "./user";

@Entity()
export class Pricelist {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne(() => User, user => user.pricelists)
    @JoinColumn({ name: "user_id" })
    public user: User;

    @Column()
    public name: string;
}
