import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1748880285545 implements MigrationInterface {
    name = 'CreateTables1748880285545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "total_assigned_records" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assigned_to" character varying NOT NULL, "batch_id" uuid, "property_address" character varying NOT NULL, "transaction_date" date NOT NULL, "borrower_name" character varying NOT NULL, "loan_amount" numeric NOT NULL, "sales_price" numeric NOT NULL, "down_payment" numeric NOT NULL, "apn" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'Pending', "tiff_image_path" character varying, "tiff_original_name" character varying, "locked_by" character varying, "lock_timestamp" TIMESTAMP, "entered_by" character varying NOT NULL, "entered_by_date" TIMESTAMP NOT NULL, "reviewed_by" character varying, "reviewed_by_date" TIMESTAMP, "embedding" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_188149422ee2454660abf1d5ee5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_94a720d7a8b59c3310ca8dafe4f" UNIQUE ("name"), CONSTRAINT "PK_55e7ff646e969b61d37eea5be7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "record_id" character varying NOT NULL, "changed_by" character varying NOT NULL, "action" character varying NOT NULL, "field_name" character varying, "old_value" text, "new_value" text, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "batches"`);
        await queryRunner.query(`DROP TABLE "records"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
