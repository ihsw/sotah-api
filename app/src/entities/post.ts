import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { IPostJson } from "../types/entities";
import { User } from "./user";

@Entity({ name: "posts" })
export class Post {
    @PrimaryGeneratedColumn()
    public id: number | undefined;

    @ManyToOne(() => User, user => user.posts, { nullable: false })
    @JoinColumn({ name: "user_id" })
    public user: User | undefined;

    @Column()
    public title: string;

    constructor() {
        this.title = "";
    }

    public toJson(): IPostJson {
        return {
            id: this.id!,
            title: this.title,
        };
    }
}
