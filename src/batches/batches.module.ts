import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Batch } from "./entities/batch.entity";
import { Record } from "../records/entities/record.entity";
import { BatchesService } from "./batches.service";
import { BatchesController } from "./batches.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Batch, Record])],
    providers: [BatchesService],
    controllers: [BatchesController],
    exports: [TypeOrmModule],
})
export class BatchesModule {}
