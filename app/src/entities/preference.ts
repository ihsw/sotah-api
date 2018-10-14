import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { User } from "./user";

@Entity()
export class Preference {
    @PrimaryGeneratedColumn()
    public id: number;

    @OneToOne(() => User, user => user.preference, { nullable: false })
    @JoinColumn({ name: "user_id" })
    public user: User;

    @Column({ name: "current_region", nullable: true })
    public currentRegion: string;

    @Column({ name: "current_realm", nullable: true })
    public currentRealm: string;
}
