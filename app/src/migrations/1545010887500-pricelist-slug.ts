import {MigrationInterface, QueryRunner} from "typeorm";

export class pricelistSlug1545010887500 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "pricelists" ADD "slug" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "pricelists" DROP COLUMN "slug"`);
    }

}
