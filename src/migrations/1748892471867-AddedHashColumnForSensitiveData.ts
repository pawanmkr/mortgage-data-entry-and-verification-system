import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedHashColumnForSensitiveData1748892471867 implements MigrationInterface {
    name = 'AddedHashColumnForSensitiveData1748892471867'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_records_embedding"`);
        await queryRunner.query(`ALTER TABLE "records" ADD "property_address_hash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "records" ADD "borrower_name_hash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "records" ADD "apn_hash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "records" ALTER COLUMN "assigned_to" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "records" DROP COLUMN "embedding"`);
        await queryRunner.query(`ALTER TABLE "records" ADD "embedding" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_49ef49b9a6b76f8da4046345fa" ON "records" ("property_address_hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_aeced1063c6c862293384922ba" ON "records" ("borrower_name_hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_d3d36daf17e9188f36bd88a3e7" ON "records" ("apn_hash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_d3d36daf17e9188f36bd88a3e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aeced1063c6c862293384922ba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49ef49b9a6b76f8da4046345fa"`);
        await queryRunner.query(`ALTER TABLE "records" DROP COLUMN "embedding"`);
        await queryRunner.query(`ALTER TABLE "records" ADD "embedding" vector`);
        await queryRunner.query(`ALTER TABLE "records" ALTER COLUMN "assigned_to" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "records" DROP COLUMN "apn_hash"`);
        await queryRunner.query(`ALTER TABLE "records" DROP COLUMN "borrower_name_hash"`);
        await queryRunner.query(`ALTER TABLE "records" DROP COLUMN "property_address_hash"`);
        await queryRunner.query(`CREATE INDEX "idx_records_embedding" ON "records" ("embedding") `);
    }

}
