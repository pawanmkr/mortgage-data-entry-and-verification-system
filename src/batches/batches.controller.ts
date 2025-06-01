import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Param,
    Delete,
    Query,
} from "@nestjs/common";
import { BatchesService } from "./batches.service";
import { BatchType } from "./enums/batch-type.enum";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { UserRole } from "src/users/enums/role.enum";

@Controller("batches")
export class BatchesController {
    constructor(private readonly service: BatchesService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    create(@Body() body: { name: string; type: BatchType }) {
        return this.service.createBatch(body.name, body.type);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.service.findAll();
    }

    @Post("/assign-records")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    assignRecordsToBatch(
        @Body() body: { batchId: string; recordIds: string[] }
    ) {
        return this.service.assignRecordsToBatch(body.batchId, body.recordIds);
    }

    @Get(":batchId/records")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    getRecordsInBatch(
        @Param("batchId") batchId: string,
        @Query("limit") limit: number = 10,
        @Query("offset") offset: number = 0
    ) {
        return this.service.getRecordsInBatch(batchId, limit, offset);
    }

    @Post("/unassign-records")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    unassignRecordsFromBatch(@Body() body: { recordIds: string[] }) {
        return this.service.unassignRecordsFromBatch(body.recordIds);
    }
}
