import * as jwt from "jsonwebtoken";
import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { Messenger } from "../lib/messenger";
import { getJwtOptions } from "../lib/session";
import { Preference } from "./preference";
import { Pricelist } from "./pricelist";

export enum UserLevel {
    Admin = 60,
    Regular = 5,
}

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn({ name: "id" })
    public id: number | undefined;

    @OneToOne(() => Preference, preference => preference.user)
    public preference: Preference | undefined;

    @OneToMany(() => Pricelist, pricelist => pricelist.user)
    public pricelists: Pricelist[] | undefined;

    @Column({ nullable: false })
    public email: string;

    @Column({ name: "hashed_password", nullable: false })
    public hashedPassword: string;

    @Column("int", { nullable: false })
    public level: UserLevel;

    constructor() {
        this.email = "";
        this.hashedPassword = "";
        this.level = UserLevel.Regular;
    }

    public async generateJwtToken(messenger: Messenger): Promise<string> {
        const jwtOptions = await getJwtOptions(messenger);

        return jwt.sign({ data: this.id }, jwtOptions.secret, {
            audience: jwtOptions.audience,
            issuer: jwtOptions.issuer,
        });
    }
}
