import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { User } from "./user";

export interface IPreferenceJson {
    id: number;
    current_region: string | null;
    current_realm: string | null;
}

@Entity({ name: "preferences" })
export class Preference {
    @PrimaryGeneratedColumn()
    public id: number | undefined;

    @OneToOne(() => User, user => user.preference, { nullable: false, eager: true })
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

    public toJson(): IPreferenceJson {
        return {
            current_realm: this.currentRealm,
            current_region: this.currentRegion,
            id: this.id!,
        };
    }
}
