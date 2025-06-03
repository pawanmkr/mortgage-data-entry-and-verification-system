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
    BadRequestException,
    UploadedFile,
    UseInterceptors,
} from "@nestjs/common";
import { RecordsService } from "./records.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateRecordDto } from "./dtos/create-record.dto";
import { UpdateRecordDto } from "./dtos/update-record.dto";
import { RecordVerificationStatus } from "./enums/record-verification-status.enum";
import { UserRole } from "src/users/enums/role.enum";
import { SearchRecordsDto } from "./dtos/search-record.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { AuthenticatedRequest } from "./interfaces/authenticated-request.interface";

@Controller("records")
export class RecordsController {
    private readonly logger = new Logger(RecordsController.name);

    constructor(private readonly recordsService: RecordsService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor("file", {
            storage: diskStorage({
                destination: "./uploads/tiffs",
                filename: (req, file, cb) => {
                    const name = file.originalname.replace(/\s+/g, "_");
                    cb(null, `${Date.now()}-${name}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (
                    file.mimetype === "image/tiff" ||
                    file.originalname.endsWith(".tif") ||
                    file.originalname.endsWith(".tiff")
                ) {
                    cb(null, true);
                } else {
                    cb(
                        new BadRequestException("Only TIFF files are allowed"),
                        false
                    );
                }
            },
            limits: { fileSize: 10 * 1024 * 1024 },
        })
    )
    async create(
        @UploadedFile() file: Express.Multer.File,
        @Body("meta") meta: string,
        @Req() req: AuthenticatedRequest
    ) {
        const parsedMeta: CreateRecordDto = JSON.parse(meta);
        return this.recordsService.create(parsedMeta, file, req.user.username);
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
        return this.recordsService.autocompleteVectorSearch(
            query,
            limit,
            req.user.username,
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
        return this.recordsService.lock(id, req.user.username);
    }

    @Put(":id/unlock")
    @UseGuards(JwtAuthGuard)
    unlockRecord(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
        return this.recordsService.manualRecordUnlock(id, req.user.username);
    }

    @Put(":id/assign")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    assignRecord(@Param("id") id: string, @Body("assignTo") assignTo: string) {
        return this.recordsService.assignRecord(id, assignTo);
    }

    @Put(":id")
    @UseGuards(JwtAuthGuard)
    async updateRecord(
        @Param("id") id: string,
        @Body() body: UpdateRecordDto,
        @Req() req: AuthenticatedRequest
    ) {
        return await this.recordsService.update(id, body, req.user.username);
    }

    @Put(":id/review")
    @UseGuards(JwtAuthGuard)
    async review(
        @Param("id") id: string,
        @Body("status") status: RecordVerificationStatus,
        @Req() req: AuthenticatedRequest
    ) {
        return this.recordsService.review(id, status, req.user.username);
    }
}
