import dataSource from "../data-source";
import { User } from "src/users/entities/user.entity";
import { getUsers } from "./user";
import { Record } from "src/records/entities/record.entity";
import { UserRole } from "src/users/enums/role.enum";
import { getRecords } from "./record";
import { EmbeddingsService } from "src/records/embedding.service";
import { DeepPartial } from "typeorm";
import pgvector from "pgvector";

async function seed() {
    await dataSource.initialize();

    const embeddingService = new EmbeddingsService();

    const userRepo = dataSource.getRepository(User);
    const recordRepo = dataSource.getRepository(Record);

    // --- Seed Users ---
    const users = getUsers();
    const userEntities: DeepPartial<User>[] = await Promise.all(users);
    const insertedUsers = await userRepo.save(userEntities);

    // Get only VA users' IDs
    const vaUsers = insertedUsers.filter((u) => u.role === UserRole.VA);
    const vaUserIds = vaUsers.map((u) => u.id);

    // --- Seed Records ---
    const records = getRecords(vaUserIds);
    await recordRepo.save(records);

    // --- Generate Embeddings for Records ---
    const all = await recordRepo.find();
    for (const record of all) {
        const text = `${record.property_address} ${record.borrower_name}`;
        console.log(
            `Generating embedding with text: "${text}" for record ID: ${record.id}`
        );
        const vector = await embeddingService.generateVectorEmbedding(text);
        record.embedding = `[${vector.join(",")}]`;
        await recordRepo.save(record);
    }

    console.log("Seeding complete!");
    await dataSource.destroy();
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
