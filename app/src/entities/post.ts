import { BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { IPostJson } from "../types/entities";
import { User } from "./user";

@Entity({ name: "posts" })
export class Post {
    @PrimaryGeneratedColumn()
    public id: number | undefined;

    @ManyToOne(() => User, user => user.posts, { nullable: false })
    @JoinColumn({ name: "user_id" })
    public user: User | undefined;

    @Column({ type: "varchar", length: 255 })
    public title: string;

    @Index({ unique: true })
    @Column({ type: "varchar", length: 255 })
    public slug: string;

    @Column({ type: "text" })
    public body: string;

    @Column({ type: "text" })
    public summary: string;

    @Column({ type: "timestamp" })
    public createdAt: Date;

    constructor() {
        this.title = "";
        this.slug = "";
        this.body = "";
        this.summary = "";
        this.createdAt = new Date();
    }

    @BeforeInsert()
    public setCreatedAt() {
        this.createdAt = new Date();
    }

    public toJson(): IPostJson {
        return {
            body: this.body,
            createdAt: this.createdAt.getTime() / 1000,
            id: this.id!,
            slug: this.slug,
            summary: this.summary,
            title: this.title,
        };
    }
}
