import {MigrationInterface, QueryRunner} from "typeorm";

export class postMeta1545576674860 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DELETE FROM "posts"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "body" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "createdAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "title" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "body"`);
    }

}
