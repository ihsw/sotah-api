import {MigrationInterface, QueryRunner} from "typeorm";

export class postSlug1545593015884 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DELETE FROM "posts"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "slug" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "slug"`);
    }

}
