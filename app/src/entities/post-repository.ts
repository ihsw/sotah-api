import { EntityRepository, Repository } from "typeorm";

import { Post } from "./post";

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
    public async hasSlug(slug: string): Promise<boolean> {
        return typeof (await this.findOne({ where: { slug } })) !== "undefined";
    }
}
