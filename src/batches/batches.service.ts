import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Batch } from "./entities/batch.entity";

@Injectable()
export class BatchesService {
    constructor(
        @InjectRepository(Batch)
        private readonly batchRepo: Repository<Batch>
    ) {}

    createBatch(data: Partial<Batch>) {
        const batch = this.batchRepo.create(data);
        return this.batchRepo.save(batch);
    }

    findAll() {
        return this.batchRepo.find();
    }
}
