import * as jwt from "jsonwebtoken";
import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { Messenger } from "../lib/messenger";
import { getJwtOptions } from "../lib/session";
import { IUserJson, UserLevel } from "../types/entities";
import { Post } from "./post";
import { Preference } from "./preference";
import { Pricelist } from "./pricelist";

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    public id: number | undefined;

    @OneToOne(() => Preference, preference => preference.user)
    public preference: Preference | undefined;

    @OneToMany(() => Pricelist, pricelist => pricelist.user)
    public pricelists: Pricelist[] | undefined;

    @OneToMany(() => Post, post => post.user)
    public posts: Post[] | undefined;

    @Column({ nullable: false, unique: true })
    public email: string;

    @Column({ name: "hashed_password", nullable: false })
    public hashedPassword: string;

    @Column("int", { default: UserLevel.Regular, nullable: false })
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

    public toJson(): IUserJson {
        return {
            email: this.email,
            id: this.id!,
            level: this.level,
        };
    }
}
