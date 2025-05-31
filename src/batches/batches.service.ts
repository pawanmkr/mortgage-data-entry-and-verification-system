import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Batch } from "./entities/batch.entity";
import { BatchType } from "./enums/batch-type.enum";

@Injectable()
export class BatchesService {
    constructor(
        @InjectRepository(Batch)
        private readonly batchRepo: Repository<Batch>
    ) {}

    createBatch(name: string, type: BatchType) {
        const batch = this.batchRepo.create({ name, type });
        return this.batchRepo.save(batch);
    }

    findAll() {
        return this.batchRepo.find();
    }
}
