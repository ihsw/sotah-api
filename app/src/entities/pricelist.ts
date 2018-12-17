import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { IPricelistEntryJson, IPricelistJson } from "../types/entities";
import { PricelistEntry } from "./pricelist-entry";
import { ProfessionPricelist } from "./profession-pricelist";
import { User } from "./user";

@Entity({ name: "pricelists" })
export class Pricelist {
    @PrimaryGeneratedColumn()
    public id: number | undefined;

    @ManyToOne(() => User, user => user.pricelists, { eager: true })
    @JoinColumn({ name: "user_id" })
    public user: User | undefined;

    @OneToOne(() => ProfessionPricelist, professionPricelist => professionPricelist.pricelist)
    public professionPricelist: ProfessionPricelist | undefined;

    @OneToMany(() => PricelistEntry, entry => entry.pricelist, {
        eager: true,
    })
    public entries: PricelistEntry[] | undefined;

    @Column()
    public name: string;

    @Column("varchar", { length: 255, nullable: true })
    public slug: string | null;

    constructor() {
        this.name = "";
        this.slug = null;
    }

    public toJson(): IPricelistJson {
        const entries: IPricelistEntryJson[] = (() => {
            if (typeof this.entries === "undefined") {
                return [];
            }

            return this.entries.map(v => v.toJson());
        })();

        return {
            id: this.id!,
            name: this.name,
            pricelist_entries: entries,
            slug: this.slug,
        };
    }
}
