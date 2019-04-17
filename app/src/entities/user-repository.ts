import { AbstractRepository, EntityRepository } from "typeorm";

import { User } from "./user";

@EntityRepository(User)
export class UserRepository extends AbstractRepository<User> {
    public async hasNoEmail(email: string, exceptEmail?: string): Promise<boolean> {
        const found = await this.repository.findOne({ where: { email } });
        if (typeof found === "undefined") {
            return true;
        }

        if (typeof exceptEmail === "undefined") {
            return true;
        }

        return found.email === exceptEmail;
    }
}
