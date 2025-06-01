import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    UseGuards,
    Req,
    Logger,
    Query,
} from "@nestjs/common";
import { RecordsService } from "./records.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateRecordDto } from "./dtos/create-record.dto";
import { Request } from "express";
import { UpdateRecordDto } from "./dtos/update-record.dto";
import { RecordVerificationStatus } from "./enums/record-verification-status.enum";
import { UserRole } from "src/users/enums/role.enum";
import { SearchRecordsDto } from "./dtos/search-record.dto";

interface AuthenticatedRequest extends Request {
    user: { id: string; [key: string]: any };
}

@Controller("records")
export class RecordsController {
    private readonly logger = new Logger(RecordsController.name);

    constructor(private readonly recordsService: RecordsService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    createRecord(
        @Body() body: CreateRecordDto,
        @Req() req: AuthenticatedRequest
    ) {
        return this.recordsService.create(body, req.user.userId);
    }

    @Get("assigned")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VA)
    async getAssignedRecords(
        @Req() req: AuthenticatedRequest,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("status") status?: RecordVerificationStatus
    ) {
        return this.recordsService.getAssignedRecords(
            req.user.userId,
            req.user.role,
            limit ? Number(limit) : 10,
            offset ? Number(offset) : 0,
            status
        );
    }

    @Get("search")
    @UseGuards(JwtAuthGuard)
    async searchRecords(
        @Query() searchDto: SearchRecordsDto,
        @Req() req: AuthenticatedRequest
    ) {
        return this.recordsService.searchRecords(
            searchDto,
            req.user.userId,
            req.user.role
        );
    }

    @Get("autocomplete")
    @UseGuards(JwtAuthGuard)
    async autoComplete(
        @Query("q") query: string,
        @Query("field") field: string = "all",
        @Query("limit") limit: number = 10,
        @Req() req: AuthenticatedRequest
    ) {
        // return this.recordsService.autoComplete(
        //     query,
        //     field,
        //     limit,
        //     req.user.userId,
        //     req.user.role
        // );
        return this.recordsService.smartSuggestions(
            query,
            limit,
            req.user.userId,
            req.user.role
        );
    }

    @Get(":id")
    findOneRecord(@Param("id") id: string) {
        return this.recordsService.findOne(id);
    }

    @Put(":id/lock")
    @UseGuards(JwtAuthGuard)
    lockRecord(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
        return this.recordsService.lock(id, req.user.userId);
    }

    @Put(":id/unlock")
    @UseGuards(JwtAuthGuard)
    unlockRecord(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
        return this.recordsService.unlock(id, req.user.userId);
    }

    // Admin-only reassign endpoint
    @Put(":id/reassign")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    reassignRecord(
        @Param("id") id: string,
        @Body("newUserId") newUserId: string,
        @Req() req: AuthenticatedRequest
    ) {
        return this.recordsService.reassign(id, newUserId, req.user.userId);
    }

    @Put(":id")
    @UseGuards(JwtAuthGuard)
    async updateRecord(
        @Param("id") id: string,
        @Body() body: UpdateRecordDto,
        @Req() req: AuthenticatedRequest
    ) {
        return await this.recordsService.update(id, body, req.user.userId);
    }

    @Put(":id/review")
    @UseGuards(JwtAuthGuard)
    async review(
        @Param("id") id: string,
        @Body("status") status: RecordVerificationStatus,
        @Req() req: AuthenticatedRequest
    ) {
        return this.recordsService.review(id, status, req.user.userId);
    }
}
