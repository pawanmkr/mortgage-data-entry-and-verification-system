import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1748773410621 implements MigrationInterface {
    name = 'CreateTables1748773410621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_94a720d7a8b59c3310ca8dafe4f" UNIQUE ("name"), CONSTRAINT "PK_55e7ff646e969b61d37eea5be7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying NOT NULL, "field_name" character varying, "old_value" text, "new_value" text, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "recordIdId" uuid, "userIdId" uuid, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "batch_id" uuid, "property_address" character varying NOT NULL, "transaction_date" date NOT NULL, "borrower_name" character varying NOT NULL, "loan_amount" numeric NOT NULL, "sales_price" numeric NOT NULL, "down_payment" numeric NOT NULL, "apn" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'Pending', "locked_by" character varying, "lock_timestamp" TIMESTAMP, "entered_by_date" TIMESTAMP NOT NULL, "reviewed_by" character varying, "reviewed_by_date" TIMESTAMP, "embedding" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "assignedToId" uuid, "enteredById" uuid, CONSTRAINT "PK_188149422ee2454660abf1d5ee5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_e26dd4fd17c654c7a449d784bd4" FOREIGN KEY ("recordIdId") REFERENCES "records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_d2b115f890b1fb84c3a4d0138a6" FOREIGN KEY ("userIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "records" ADD CONSTRAINT "FK_0688c56ecf528770ba84974f798" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "records" ADD CONSTRAINT "FK_5715021a1911bed335cc6aa5fe8" FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "records" ADD CONSTRAINT "FK_139a674935f1e008906064ce806" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "records" DROP CONSTRAINT "FK_139a674935f1e008906064ce806"`);
        await queryRunner.query(`ALTER TABLE "records" DROP CONSTRAINT "FK_5715021a1911bed335cc6aa5fe8"`);
        await queryRunner.query(`ALTER TABLE "records" DROP CONSTRAINT "FK_0688c56ecf528770ba84974f798"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_d2b115f890b1fb84c3a4d0138a6"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_e26dd4fd17c654c7a449d784bd4"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "records"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "batches"`);
    }

}
