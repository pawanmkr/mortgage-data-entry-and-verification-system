import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./entities/audit-log.entity";

@Injectable()
export class AuditLogsService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>
    ) {}

    log(data: Omit<AuditLog, "id" | "timestamp">) {
        const log = this.auditRepo.create(data);
        return this.auditRepo.save(log);
    }
}
