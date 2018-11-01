import {MigrationInterface, QueryRunner} from "typeorm";

export class init1541082542301 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        if ((await queryRunner.hasTable("pricelist_entries")) === false) {
            await queryRunner.query(`CREATE TABLE "pricelist_entries" ("id" SERIAL NOT NULL, "item_id" integer NOT NULL, "quantity_modifier" integer NOT NULL, "pricelist_id" integer, CONSTRAINT "PK_a35304bc106726d9ced2d3ea39d" PRIMARY KEY ("id"))`);
        }
        if ((await queryRunner.hasTable("profession_pricelists")) === false) {
            await queryRunner.query(`CREATE TABLE "profession_pricelists" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "expansion" character varying(255) NOT NULL, "pricelist_id" integer, CONSTRAINT "REL_e6debd622767504a3baa21972d" UNIQUE ("pricelist_id"), CONSTRAINT "PK_f419d51561851937e60039d363d" PRIMARY KEY ("id"))`);
        }
        if ((await queryRunner.hasTable("pricelists")) === false) {
            await queryRunner.query(`CREATE TABLE "pricelists" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "user_id" integer, CONSTRAINT "PK_f6086a54a739eb1b8cd6cf352f4" PRIMARY KEY ("id"))`);
            await queryRunner.query(`ALTER TABLE "pricelist_entries" ADD CONSTRAINT "FK_2231a48d0181dc452ac6cd0b8cd" FOREIGN KEY ("pricelist_id") REFERENCES "pricelists"("id")`);
            await queryRunner.query(`ALTER TABLE "profession_pricelists" ADD CONSTRAINT "FK_e6debd622767504a3baa21972db" FOREIGN KEY ("pricelist_id") REFERENCES "pricelists"("id")`);
        }
        if ((await queryRunner.hasTable("users")) === false) {
            await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "hashed_password" character varying NOT NULL, "level" integer NOT NULL DEFAULT 5, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
            await queryRunner.query(`ALTER TABLE "pricelists" ADD CONSTRAINT "FK_f779348c1f648b5fbf6669f352a" FOREIGN KEY ("user_id") REFERENCES "users"("id")`);
        }
        if ((await queryRunner.hasTable("preferences")) === false) {
            await queryRunner.query(`CREATE TABLE "preferences" ("id" SERIAL NOT NULL, "current_region" character varying(255), "current_realm" character varying(255), "user_id" integer NOT NULL, CONSTRAINT "REL_34a542d34f1c75c43e78df2e67" UNIQUE ("user_id"), CONSTRAINT "PK_17f8855e4145192bbabd91a51be" PRIMARY KEY ("id"))`);
            await queryRunner.query(`ALTER TABLE "preferences" ADD CONSTRAINT "FK_34a542d34f1c75c43e78df2e67a" FOREIGN KEY ("user_id") REFERENCES "users"("id")`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT "FK_34a542d34f1c75c43e78df2e67a"`);
        await queryRunner.query(`ALTER TABLE "pricelists" DROP CONSTRAINT "FK_f779348c1f648b5fbf6669f352a"`);
        await queryRunner.query(`ALTER TABLE "profession_pricelists" DROP CONSTRAINT "FK_e6debd622767504a3baa21972db"`);
        await queryRunner.query(`ALTER TABLE "pricelist_entries" DROP CONSTRAINT "FK_2231a48d0181dc452ac6cd0b8cd"`);
        await queryRunner.query(`DROP TABLE "preferences"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "pricelists"`);
        await queryRunner.query(`DROP TABLE "profession_pricelists"`);
        await queryRunner.query(`DROP TABLE "pricelist_entries"`);
    }

}
