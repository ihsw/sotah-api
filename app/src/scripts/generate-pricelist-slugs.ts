import * as process from "process";

import "reflect-metadata";
import * as getSlug from "speakingurl";
import { createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { Post } from "../entities/post";
import { Preference } from "../entities/preference";
import { Pricelist } from "../entities/pricelist";
import { PricelistEntry } from "../entities/pricelist-entry";
import { ProfessionPricelist } from "../entities/profession-pricelist";
import { User } from "../entities/user";

(async () => {
    const dbHost = process.env["DB_HOST"] || "";
    const dbConn = await createConnection({
        database: "postgres",
        entities: [Preference, Pricelist, PricelistEntry, ProfessionPricelist, User, Post],
        host: dbHost,
        logging: false,
        name: `app-${uuidv4()}`,
        password: "",
        port: 5432,
        synchronize: false,
        type: "postgres",
        username: "postgres",
    });

    const posts = await dbConn.getRepository(Pricelist).find({
        where: { slug: null },
    });
    await Promise.all(
        posts.map(v => {
            v.slug = getSlug(v.name);

            return dbConn.manager.save(v);
        }),
    );

    process.exit(0);
})();
