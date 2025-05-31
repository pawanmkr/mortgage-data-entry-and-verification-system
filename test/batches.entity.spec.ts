import { Batch } from "../src/batches/entities/batch.entity";

describe("Batch Entity", () => {
    it("should create a batch with correct type", () => {
        const batch = new Batch();
        batch.batch_name = "2025-05-12-Daily";
        batch.batch_type = "Daily";
        expect(batch.batch_type).toBe("Daily");
    });
});
