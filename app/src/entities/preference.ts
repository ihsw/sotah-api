import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { User } from "./user";

@Entity()
export class Preference {
    @PrimaryGeneratedColumn()
    public id: number | undefined;

    @OneToOne(() => User, user => user.preference, { nullable: false })
    @JoinColumn({ name: "user_id" })
    public user: User | undefined;

    @Column("varchar", { length: 255, name: "current_region", nullable: true })
    public currentRegion: string | null;

    @Column("varchar", { length: 255, name: "current_realm", nullable: true })
    public currentRealm: string | null;

    constructor() {
        this.currentRegion = null;
        this.currentRealm = null;
    }
}
