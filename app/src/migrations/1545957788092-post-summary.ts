import {MigrationInterface, QueryRunner} from "typeorm";

export class postSummary1545957788092 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DELETE FROM "posts"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "summary" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "summary"`);
    }

}
