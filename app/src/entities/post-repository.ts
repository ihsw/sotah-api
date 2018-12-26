import { AbstractRepository, EntityRepository } from "typeorm";

import { Post } from "./post";

@EntityRepository(Post)
export class PostRepository extends AbstractRepository<Post> {
    public async hasSlug(slug: string): Promise<boolean> {
        return typeof (await this.repository.findOne({ where: { slug } })) !== "undefined";
    }
}
