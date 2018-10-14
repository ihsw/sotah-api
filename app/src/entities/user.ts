import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { Preference } from "./preference";

export enum UserLevel {
    Admin = 60,
    Regular = 5,
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    public id: number;

    @OneToOne(() => Preference, preference => preference.user)
    public preference: Preference;

    @Column({ nullable: false })
    public email: string;

    @Column({ name: "hashed_password", nullable: false })
    public hashedPassword: string;

    @Column({ nullable: false })
    public level: UserLevel;
}
