import { MigrationInterface, QueryRunner } from "typeorm";

export class AssignedToCanBeNull1748892626529 implements MigrationInterface {
    name = 'AssignedToCanBeNull1748892626529'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "records" ALTER COLUMN "assigned_to" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "records" ALTER COLUMN "assigned_to" SET NOT NULL`);
    }

}
