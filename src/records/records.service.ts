import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Record } from "./entities/record.entity";
import { CreateRecordDto } from "./dtos/create-record.dto";
import { UpdateRecordDto } from "./dtos/update-record.dto";
import { RecordVerificationStatus } from "./enums/record-verification-status.enum";
import { AuditLogsService } from "src/audit-logs/audit-logs.service";
import { VA_ACTION } from "src/audit-logs/enums/va-action.enum";

@Injectable()
export class RecordsService {
    private readonly logger = new Logger(RecordsService.name);
    private readonly LOCK_DURATION = 10 * 60 * 1000; // 10 minutes

    constructor(
        @InjectRepository(Record)
        private readonly recordRepo: Repository<Record>,
        private readonly auditLogService: AuditLogsService
    ) {}

    async create(data: CreateRecordDto, userId: string) {
        let record = this.recordRepo.create(data);
        record = await this.recordRepo.save(record);

        await this.auditLogService.createAuditLog({
            record_id: record.id,
            user_id: userId,
            action: VA_ACTION.CREATE,
            field_name: "all",
            old_value: "",
            new_value: JSON.stringify(record),
        });
        return record;
    }

    async findOne(id: string): Promise<Record> {
        const record = await this.recordRepo.findOne({ where: { id } });
        if (!record) {
            this.logger.debug(`Record ${id} not found`);
            throw new NotFoundException(`Record ${id} not found`);
        }
        return record;
    }

    // checks if the lock on a record is expired (10 minutes)
    isRecordUnlocked(record: Record): boolean {
        if (!record.lock_timestamp) {
            this.logger.debug(`Record ${record.id} is unlocked`);
            return true;
        }
        const now = new Date();
        const lockTime = new Date(record.lock_timestamp);
        const elapsedLockTime = now.getTime() - lockTime.getTime();
        const timeDifference = elapsedLockTime - this.LOCK_DURATION;

        this.logger.debug(
            `Record with ${record.id} is ${
                timeDifference > 0 ? "unlocked" : "locked"
            }. Time difference is ${timeDifference}`
        );

        return elapsedLockTime > this.LOCK_DURATION;
    }

    async stopIfSubmittedOrReturnRecord(id: string) {
        let record = await this.findOne(id);
        const submitted = record.status !== RecordVerificationStatus.PENDING;
        if (submitted) {
            throw new BadRequestException(
                "Only records with PENDING status can be edited"
            );
        }
        return record;
    }

    // unlocks a record (admin only).
    async unlock(recordId: string, userId: string): Promise<Record | null> {
        let record = await this.findOne(recordId);
        const oldLockValues = {
            locked_by: record.locked_by,
            locked_timestamp: record.lock_timestamp,
        };
        const newLockValues = {
            locked_by: "",
            locked_timestamp: null,
        };
        record.locked_by = newLockValues.locked_by;
        record.lock_timestamp = newLockValues.locked_timestamp;
        record = await this.recordRepo.save(record);

        await this.auditLogService.createAuditLog({
            record_id: record.id,
            user_id: userId,
            action: VA_ACTION.EDIT,
            field_name: "locked_by,lock_timestamp",
            old_value: JSON.stringify(oldLockValues),
            new_value: JSON.stringify(newLockValues),
        });
        return record;
    }

    // FIXME: i think this is not needed, review it
    // reassigns a record to a new VA (admin only).
    async reassign(
        id: string,
        newUserId: string,
        userId: string
    ): Promise<Record | null> {
        let record = await this.findOne(id);
        const oldLockValues = {
            locked_by: record.locked_by,
            lock_timestamp: record.lock_timestamp,
        };
        record.locked_by = newUserId;
        record.lock_timestamp = new Date();
        record = await this.recordRepo.save(record);

        await this.auditLogService.createAuditLog({
            record_id: record.id,
            user_id: userId,
            action: VA_ACTION.EDIT,
            field_name: "locked_by,lock_timestamp",
            old_value: JSON.stringify(oldLockValues),
            new_value: JSON.stringify({
                locked_by: newUserId,
                lock_timestamp: record.lock_timestamp,
            }),
        });
        return record;
    }

    // lock record is it is unlocked
    async lock(id: string, userId: string): Promise<Record | null> {
        let record = await this.stopIfSubmittedOrReturnRecord(id);

        const unlocked = this.isRecordUnlocked(record);
        if (!unlocked) throw new ConflictException("Record is already locked");

        const oldLockValues = {
            locked_by: record.locked_by,
            lock_timestamp: record.lock_timestamp,
        };
        record.locked_by = userId;
        record.lock_timestamp = new Date();
        record = await this.recordRepo.save(record);

        await this.auditLogService.createAuditLog({
            record_id: record.id,
            user_id: userId,
            action: VA_ACTION.EDIT,
            field_name: "locked_by,lock_timestamp",
            old_value: JSON.stringify(oldLockValues),
            new_value: JSON.stringify({
                locked_by: userId,
                lock_timestamp: record.lock_timestamp,
            }),
        });
        this.logger.debug(`User ${userId} has locked the record ${id} again`);
        return record;
    }

    async update(
        id: string,
        data: UpdateRecordDto,
        userId: string
    ): Promise<Record> {
        let record = await this.findOne(id);
        const submitted = record.status !== RecordVerificationStatus.PENDING;
        if (submitted) {
            throw new BadRequestException(
                "Only records with PENDING status can be edited"
            );
        }
        const temporaryEditLock =
            record.locked_by != "" && record.lock_timestamp !== null;
        if (temporaryEditLock) {
            throw new ConflictException(
                "Please wait! Record is temporarily locked and cannot be edited"
            );
        }
        const oldValues = { ...record };
        Object.assign(record, data);
        record = await this.recordRepo.save(record);

        await this.auditLogService.createAuditLog({
            record_id: record.id,
            user_id: userId,
            action: VA_ACTION.EDIT,
            field_name: Object.keys(data).join(","),
            old_value: JSON.stringify(oldValues),
            new_value: JSON.stringify({ ...data }),
        });
        return record;
    }

    async review(
        id: string,
        status: RecordVerificationStatus,
        reviewerId: string
    ): Promise<Record> {
        let record = await this.findOne(id);
        if (record.locked_by != "" && record.lock_timestamp !== null) {
            throw new ConflictException(
                "Record is locked and cannot be reviewed"
            );
        }
        const oldValues = {
            status: record.status,
            reviewed_by: record.reviewed_by,
            reviewed_by_date: record.reviewed_by_date,
        };
        let action: VA_ACTION;
        switch (status) {
            case RecordVerificationStatus.VERIFIED:
                action = VA_ACTION.VERIFY;
                break;

            case RecordVerificationStatus.FLAGGED:
                action = VA_ACTION.FLAG;
                break;

            default:
                throw new BadRequestException(`${status} is not a valid action`);
        }
        record.status = status;
        record.reviewed_by = reviewerId;
        record.reviewed_by_date = new Date();
        record = await this.recordRepo.save(record);

        await this.auditLogService.createAuditLog({
            record_id: record.id,
            user_id: reviewerId,
            action,
            field_name: "status,reviewed_by,reviewed_by_date",
            old_value: JSON.stringify(oldValues),
            new_value: JSON.stringify({
                status: record.status,
                reviewed_by: record.reviewed_by,
                reviewed_by_date: record.reviewed_by_date,
            }),
        });
        return record;
    }

    async getAssignedRecords(
        userId: string,
        role: string,
        limit = 10,
        offset = 0,
        status?: RecordVerificationStatus
    ) {
        // if (role !== UserRole.VA) {
        //     throw new ForbiddenException(
        //         "Only VA users can access assigned records"
        //     );
        // }
        const query = this.recordRepo
            .createQueryBuilder("record")
            .where("record.assigned_to = :userId", { userId });
        if (status) {
            query.andWhere("record.status = :status", { status });
        } else {
            query.andWhere("record.status IN (:...statuses)", {
                statuses: [
                    RecordVerificationStatus.PENDING,
                    RecordVerificationStatus.FLAGGED,
                ],
            });
        }
        query.orderBy("record.created_at", "DESC").skip(offset).take(limit);
        const [records, total] = await query.getManyAndCount();
        return { total, records };
    }
}
