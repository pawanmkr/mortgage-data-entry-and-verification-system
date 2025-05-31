import { Controller, Post, Body } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";
import { AuditLog } from "./entities/audit-log.entity";

@Controller("audit-logs")
export class AuditLogsController {
    constructor(private readonly service: AuditLogsService) {}

    @Post()
    logAction(@Body() body: Partial<AuditLog>) {
        return this.service.createLog(body);
    }
}
