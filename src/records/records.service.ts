import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Record } from "./entities/record.entity";

@Injectable()
export class RecordsService {
    constructor(
        @InjectRepository(Record)
        private readonly recordRepo: Repository<Record>
    ) {}

    create(data: Partial<Record>) {
        const record = this.recordRepo.create(data);
        return this.recordRepo.save(record);
    }

    findOne(id: string) {
        return this.recordRepo.findOne({ where: { id } });
    }

    async lock(id: string, userId: string) {
        const record = await this.recordRepo.findOne({ where: { id } });
        if (!record) return null;

        record.locked_by = userId;
        record.lock_timestamp = new Date();
        return this.recordRepo.save(record);
    }
}
