import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecordsService } from "./records.service";
import { RecordsController } from "./records.controller";
import { Record } from "./entities/record.entity";
import { UsersModule } from "src/users/users.module";
import { AuditLogsModule } from "src/audit-logs/audit-logs.module";
import { EmbeddingsService } from "./embedding.service";
import { User } from "src/users/entities/user.entity";
import { EncryptionService } from "./encryption.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Record, User]),
        UsersModule,
        AuditLogsModule,
    ],
    providers: [RecordsService, EmbeddingsService, EncryptionService],
    controllers: [RecordsController],
    exports: [RecordsService],
})
export class RecordsModule {}
