import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Batch } from "./entities/batch.entity";
import { BatchType } from "./enums/batch-type.enum";
import { Record } from "src/records/entities/record.entity";

@Injectable()
export class BatchesService {
    constructor(
        @InjectRepository(Batch)
        private readonly batchRepo: Repository<Batch>,
        @InjectRepository(Record)
        private readonly recordRepo: Repository<Record>
    ) {}

    createBatch(name: string, type: BatchType) {
        const batch = this.batchRepo.create({ name, type });
        return this.batchRepo.save(batch);
    }

    findAll() {
        return this.batchRepo.find();
    }

    async assignRecordsToBatch(batchId: string, recordIds: string[]) {
        const batch = await this.batchRepo.findOne({ where: { id: batchId } });
        if (!batch) throw new Error("Batch not found");
        const records = await this.recordRepo.findByIds(recordIds);
        for (const record of records) {
            record.batch_id = batchId;
        }
        await this.recordRepo.save(records);
        return records;
    }

    async getRecordsInBatch(batchId: string, limit: number, offset: number) {
        return this.recordRepo.find({
            where: {
                batch_id: batchId,
            },
            take: limit,
            skip: offset,
        });
    }

    async unassignRecordsFromBatch(recordIds: string[]) {
        const records = await this.recordRepo.findByIds(recordIds);
        for (const record of records) {
            record.batch_id = null;
        }
        await this.recordRepo.save(records);
        return records;
    }
}
