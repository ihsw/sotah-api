import {MigrationInterface, QueryRunner} from "typeorm";

export class postSlugIndex1545858655998 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DELETE FROM "posts"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_54ddf9075260407dcfdd724857" ON "posts"  ("slug") `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_54ddf9075260407dcfdd724857"`);
    }

}
