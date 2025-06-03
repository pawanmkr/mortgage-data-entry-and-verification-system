import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexOnEmbedding1748880422682 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(
            `CREATE INDEX IF NOT EXISTS idx_records_embedding ON records USING hnsw(embedding vector_cosine_ops);`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`DROP INDEX IF EXISTS idx_records_embedding;`);
    }
}
