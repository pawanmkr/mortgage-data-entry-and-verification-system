import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecordsService } from "./records.service";
import { RecordsController } from "./records.controller";
import { Record } from "./entities/record.entity";
import { UsersModule } from "src/users/users.module";
import { AuditLogsModule } from "src/audit-logs/audit-logs.module";

@Module({
    imports: [TypeOrmModule.forFeature([Record]), UsersModule, AuditLogsModule],
    providers: [RecordsService],
    controllers: [RecordsController],
})
export class RecordsModule {}
