import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertEmbeddingTypeToVector1748880383678
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE records
            SET embedding = embedding::vector(384)
            WHERE embedding IS NOT NULL AND embedding != ''
        `);

        await queryRunner.query(`
            ALTER TABLE records
            ALTER COLUMN embedding TYPE vector(384)
            USING CASE
                WHEN embedding IS NULL OR embedding = '' THEN NULL
                ELSE embedding::vector(384)
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE records
            ALTER COLUMN embedding TYPE varchar
        `);
    }
}
