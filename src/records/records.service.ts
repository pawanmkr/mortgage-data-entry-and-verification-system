import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Brackets, Repository, SelectQueryBuilder } from "typeorm";

import { Record } from "./entities/record.entity";
import { CreateRecordDto } from "./dtos/create-record.dto";
import { UpdateRecordDto } from "./dtos/update-record.dto";
import { RecordVerificationStatus } from "./enums/record-verification-status.enum";
import { AuditLogsService } from "src/audit-logs/audit-logs.service";
import { VA_ACTION } from "src/audit-logs/enums/va-action.enum";
import { UserRole } from "src/users/enums/role.enum";
import { SearchRecordsDto } from "./dtos/search-record.dto";
import { SearchResponseDto } from "./dtos/search-response.dto";
import { EmbeddingsService } from "./embedding.service";
import { User } from "src/users/entities/user.entity";
import { EncryptionService } from "./encryption.service";

@Injectable()
export class RecordsService {
    private readonly logger = new Logger(RecordsService.name);

    private readonly encrypter: EncryptionService;
    private readonly embedder: EmbeddingsService;

    private readonly RECORD_LOCK_DURATION = 10 * 60 * 1000; // 10 minutes
    private readonly RECORDS_PER_PAGE = 10; // default records per page
    private readonly TEN_MINUTES = 10 * 60; // 10 minutes in seconds

    constructor(
        @InjectRepository(Record)
        private readonly recordRepo: Repository<Record>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,

        private readonly auditLogService: AuditLogsService,
        private readonly configService: ConfigService,

        embeddingService: EmbeddingsService,
        encryptionService: EncryptionService
    ) {
        this.encrypter = encryptionService;
        this.embedder = embeddingService;
    }

    async create(
        data: CreateRecordDto,
        file: Express.Multer.File,
        username: string
    ): Promise<
        Omit<
            Record,
            | "embedding"
            | "property_address_hash"
            | "borrower_name_hash"
            | "apn_hash"
        >
    > {
        const textToEmbed = `${data.property_address} ${data.borrower_name} ${data.apn}`;
        const embeddings = await this.embedder.generateVectorEmbedding(
            textToEmbed
        );

        const apn = this.encrypter.encrypt(data.apn);
        const borrowerName = this.encrypter.encrypt(data.borrower_name);
        const propertyAddress = this.encrypter.encrypt(data.property_address);

        let record = this.recordRepo.create({
            ...data,
            property_address: propertyAddress.encrypted,
            property_address_hash: propertyAddress.searchHash,
            borrower_name: borrowerName.encrypted,
            borrower_name_hash: borrowerName.searchHash,
            apn: apn.encrypted,
            apn_hash: apn.searchHash,
            entered_by: username,
            entered_by_date: new Date(),
            tiff_image_path: file.filename,
            tiff_original_name: file.originalname,
            embedding: `[${embeddings.join(",")}]`,
        });
        record = await this.recordRepo.save(record);

        await this.auditLogService.log({
            record_id: record.id,
            changed_by: username,
            action: VA_ACTION.CREATE,
            field_name: "all",
            old_value: "",
            new_value: JSON.stringify(record),
        });

        return this.buildRecordResponse(record);
    }

    private buildRecordResponse(record: Record): any {
        const data = {
            ...record,
            property_address: this.encrypter.decrypt(record.property_address),
            borrower_name: this.encrypter.decrypt(record.borrower_name),
            apn: this.encrypter.decrypt(record.apn),
            tiff_image_url: record.tiff_image_path
                ? `${this.configService.get("BASE_URL")}/images/download/${
                      record.tiff_image_path
                  }`
                : null,
            tiff_original_name: record.tiff_original_name || null,
        };
        const {
            embedding,
            property_address_hash,
            borrower_name_hash,
            apn_hash,
            ...rest
        } = data;
        return rest;
    }

    async findOne(id: string): Promise<Record> {
        let record = await this.cache.get<Record>(`record:${id}`);
        if (!record) {
            record = await this.recordRepo.findOneByOrFail({ id });
            if (!record) {
                this.logger.debug(`Record ${id} not found`);
                throw new NotFoundException(`Record ${id} not found`);
            }
            await this.cache.set(`record:${id}`, record, this.TEN_MINUTES);
        }
        return this.buildRecordResponse(record);
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
        const timeDifference = elapsedLockTime - this.RECORD_LOCK_DURATION;

        this.logger.debug(
            `Record with ${record.id} is ${
                timeDifference > 0 ? "unlocked" : "locked"
            }. Time difference is ${timeDifference}`
        );

        return elapsedLockTime > this.RECORD_LOCK_DURATION;
    }

    // stop means, throw an error in the middle of something
    // where this function is called
    // return means, just return the record if it is not submitted
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

    // there's another function that is intended to be called by a system
    // this function is intended to be called by a user to manually unlock a record
    async manualRecordUnlock(
        recordId: string,
        unlockedByUsername: string
    ): Promise<Record> {
        await this.restrictAccessIfNotAssignedOnThisRecord(
            recordId,
            unlockedByUsername
        );
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

        await this.auditLogService.log({
            record_id: record.id,
            changed_by: unlockedByUsername,
            action: VA_ACTION.EDIT,
            field_name: "locked_by,lock_timestamp",
            old_value: JSON.stringify(oldLockValues),
            new_value: JSON.stringify(newLockValues),
        });
        return record;
    }

    // this function is intended to be called by a system only
    // calling otherwise can cause data inconsistency
    async autoUnlock(recordId: string): Promise<void> {
        await this.recordRepo
            .createQueryBuilder("record")
            .update(Record)
            .set({
                locked_by: null,
                lock_timestamp: null,
            })
            .where("id = :id", { id: recordId })
            .execute();

        this.logger.debug(
            `Record ${recordId} has been auto-unlocked by the system`
        );
    }

    async assignRecord(id: string, assigneeUsername: string): Promise<Record> {
        let record = await this.findOne(id);

        record.assigned_to = assigneeUsername;
        record.locked_by = null; // clear lock if reassigning
        record.lock_timestamp = null; // clear lock timestamp also
        record = await this.recordRepo.save(record);

        await this.userRepository
            .createQueryBuilder()
            .update(User)
            .set({ total_assigned_records: () => "total_assigned_records + 1" })
            .where("username = :username", { username: assigneeUsername })
            .execute();

        return record;
    }

    // lock record is it is unlocked
    async lock(id: string, lockedByUsername: string): Promise<Record | null> {
        await this.restrictAccessIfNotAssignedOnThisRecord(
            id,
            lockedByUsername
        );
        let record = await this.stopIfSubmittedOrReturnRecord(id);

        const unlocked = this.isRecordUnlocked(record);
        if (!unlocked) throw new ConflictException("Record is already locked");

        const oldLockValues = {
            locked_by: record.locked_by,
            lock_timestamp: record.lock_timestamp,
        };
        record.locked_by = lockedByUsername;
        record.lock_timestamp = new Date();
        record = await this.recordRepo.save(record);

        await this.auditLogService.log({
            record_id: record.id,
            changed_by: lockedByUsername,
            action: VA_ACTION.EDIT,
            field_name: "locked_by,lock_timestamp",
            old_value: JSON.stringify(oldLockValues),
            new_value: JSON.stringify({
                locked_by: lockedByUsername,
                lock_timestamp: record.lock_timestamp,
            }),
        });
        this.logger.debug(
            `User ${lockedByUsername} has locked the record ${id} again`
        );
        return record;
    }

    async update(
        id: string,
        data: UpdateRecordDto,
        username: string
    ): Promise<Record> {
        await this.restrictAccessIfNotAssignedOnThisRecord(id, username);

        let record = await this.findOne(id);
        const submitted = record.status !== RecordVerificationStatus.PENDING;
        if (submitted) {
            throw new BadRequestException(
                "Only records with PENDING status can be edited"
            );
        }

        const temporaryEditLock =
            record.locked_by !== "" && record.lock_timestamp !== null;
        if (temporaryEditLock) {
            throw new ConflictException(
                "Please wait! Record is temporarily locked and cannot be edited"
            );
        }

        const oldValues = { ...record };

        let embedding;
        const hasTextChange =
            data.property_address !== record.property_address ||
            data.borrower_name !== record.borrower_name;

        if (hasTextChange) {
            embedding = await this.embedder.generateVectorEmbedding(
                `${data.property_address ?? record.property_address} ${
                    data.borrower_name ?? record.borrower_name
                }`
            );
        }

        if (data.property_address) {
            const address = this.encrypter.encrypt(data.property_address);
            record.property_address = address.encrypted;
            record.property_address_hash = address.searchHash;
        }
        if (data.borrower_name) {
            const borrowerName = this.encrypter.encrypt(data.borrower_name);
            record.borrower_name = borrowerName.encrypted;
            record.borrower_name_hash = borrowerName.searchHash;
        }
        if (data.apn) {
            const apn = this.encrypter.encrypt(data.apn);
            record.apn = apn.encrypted;
            record.apn_hash = apn.searchHash;
        }

        Object.assign(record, { ...data });

        if (hasTextChange) record.embedding = `[${embedding!.join(",")}]`;
        record = await this.recordRepo.save(record);

        const logData = {
            record_id: record.id,
            changed_by: username,
            action: VA_ACTION.EDIT,
            field_name: Object.keys(data).join(","),
            old_value: JSON.stringify(oldValues),
            new_value: JSON.stringify({ ...data }),
        };
        await this.cache.set(`record:${id}`, record, this.TEN_MINUTES);
        await this.auditLogService.log(logData);
        return record;
    }

    async review(
        id: string,
        status: RecordVerificationStatus,
        reviewerUsername: string
    ): Promise<Record> {
        await this.restrictAccessIfNotAssignedOnThisRecord(
            id,
            reviewerUsername
        );
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
                throw new BadRequestException(
                    `${status} is not a valid action`
                );
        }
        record.status = status;
        record.reviewed_by = reviewerUsername;
        record.reviewed_by_date = new Date();
        record = await this.recordRepo.save(record);

        await this.auditLogService.log({
            record_id: record.id,
            changed_by: reviewerUsername,
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
        if (role !== UserRole.VA) {
            throw new ForbiddenException(
                "Only VA users can access assigned records"
            );
        }
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
        query
            .orderBy("record.created_at", "DESC")
            .skip(offset)
            .take(this.RECORDS_PER_PAGE);
        const [records, total] = await query.getManyAndCount();
        const enhancedRecords = records.map((r) => this.buildRecordResponse(r));
        return { total, records: enhancedRecords };
    }

    private applySearchFilter(
        qb: SelectQueryBuilder<Record>,
        field: string,
        searchTerm: string
    ): void {
        // Remove '%' from search term for hash generation
        const searchHash = this.encrypter.generateSearchHash(
            searchTerm.replace(/%/g, "")
        );

        switch (field) {
            case "property_address":
                qb.where("record.property_address_hash = :searchHash", {
                    searchHash,
                });
                break;
            case "apn":
                qb.where("record.apn_hash = :searchHash", { searchHash });
                break;
            case "borrower_name":
                qb.where("record.borrower_name_hash = :searchHash", {
                    searchHash,
                });
                break;
            case "all":
            default:
                qb.where(
                    new Brackets((qb) => {
                        qb.where("record.property_address_hash = :searchHash", {
                            searchHash,
                        })
                            .orWhere(
                                "record.borrower_name_hash = :searchHash",
                                { searchHash }
                            )
                            .orWhere("record.apn_hash = :searchHash", {
                                searchHash,
                            });
                    })
                );
                break;
        }
    }

    async searchRecords(
        searchDto: SearchRecordsDto,
        userId: string,
        userRole: string
    ): Promise<SearchResponseDto> {
        const { query, field = "all", limit = 10, offset = 0 } = searchDto;

        if (!query || query.trim().length < 2) {
            return {
                total: 0,
                records: [],
                hasMore: false,
            };
        }
        const searchTerm = `%${query.trim()}%`;
        const baseQueryBuilder = this.recordRepo
            .createQueryBuilder("record")
            .select([
                "record.id",
                "record.property_address",
                "record.borrower_name",
                "record.apn",
                "record.transaction_date",
                "record.loan_amount",
                "record.sales_price",
                "record.status",
                "record.created_at",
                "record.tiff_image_path",
                "record.tiff_original_name",
            ]);
        this.applySearchFilter(baseQueryBuilder, field, searchTerm);

        if (userRole === UserRole.VA) {
            baseQueryBuilder.andWhere("record.assigned_to = :userId", {
                userId,
            });
        }
        baseQueryBuilder
            .orderBy("record.created_at", "DESC")
            .skip(offset)
            .take(this.RECORDS_PER_PAGE + 1);

        const records = await baseQueryBuilder.getMany();
        const hasMore = records.length > limit;
        if (hasMore) records.pop();

        const decryptedRecords = records.map((record) => ({
            ...record,
            property_address: this.encrypter.decrypt(record.property_address),
            borrower_name: this.encrypter.decrypt(record.borrower_name),
            apn: this.encrypter.decrypt(record.apn),
        }));

        const countQuery = this.recordRepo
            .createQueryBuilder("record")
            .select("COUNT(*)", "total");

        this.applySearchFilter(countQuery, field, searchTerm);

        if (userRole === UserRole.VA) {
            countQuery.andWhere("record.assigned_to = :userId", { userId });
        }
        const totalResult = await countQuery.getRawOne();
        const total = parseInt(totalResult.total);

        return {
            total,
            records: decryptedRecords.map((record) => ({
                id: record.id,
                property_address: record.property_address,
                borrower_name: record.borrower_name,
                apn: record.apn,
                transaction_date: record.transaction_date,
                loan_amount: record.loan_amount,
                sales_price: record.sales_price,
                down_payment: record.down_payment,
                status: record.status,
                tiff_image_url: record.tiff_image_path
                    ? `${this.configService.get("BASE_URL")}/images/download/${
                          record.tiff_image_path
                      }`
                    : null,
                tiff_original_name: record.tiff_original_name || null,
            })),
            hasMore,
        };
    }

    async autoComplete(
        query: string,
        field: string = "all",
        limit: number = this.RECORDS_PER_PAGE,
        userId: string,
        userRole: string
    ): Promise<string[]> {
        if (!query || query.trim().length < 2) return [];

        let results: string[] | null = await this.cache.get(
            `autocomplete:${query}`
        );
        if (results !== null && results.length > 0) return results;

        const searchTerm = `%${query.trim()}%`;
        let queryBuilder = this.recordRepo.createQueryBuilder("record");

        switch (field) {
            case "property_address":
                queryBuilder
                    .select("DISTINCT record.property_address", "value")
                    .where(
                        "LOWER(record.property_address) LIKE LOWER(:searchTerm)",
                        { searchTerm }
                    );
                break;

            case "apn":
                queryBuilder
                    .select("DISTINCT record.apn", "value")
                    .where("LOWER(record.apn) LIKE LOWER(:searchTerm)", {
                        searchTerm,
                    });
                break;

            case "borrower_name":
                queryBuilder
                    .select("DISTINCT record.borrower_name", "value")
                    .where(
                        "LOWER(record.borrower_name) LIKE LOWER(:searchTerm)",
                        { searchTerm }
                    );
                break;

            default: // return mixed results for 'all' field
                const addresses = await this.recordRepo
                    .createQueryBuilder("record")
                    .select("DISTINCT record.property_address", "value")
                    .where(
                        "LOWER(record.property_address) LIKE LOWER(:searchTerm)",
                        { searchTerm }
                    )
                    .limit(Math.ceil(limit / 3))
                    .getRawMany();

                const borrowers = await this.recordRepo
                    .createQueryBuilder("record")
                    .select("DISTINCT record.borrower_name", "value")
                    .where(
                        "LOWER(record.borrower_name) LIKE LOWER(:searchTerm)",
                        { searchTerm }
                    )
                    .limit(Math.ceil(limit / 3))
                    .getRawMany();

                const apns = await this.recordRepo
                    .createQueryBuilder("record")
                    .select("DISTINCT record.apn", "value")
                    .where("LOWER(record.apn) LIKE LOWER(:searchTerm)", {
                        searchTerm,
                    })
                    .limit(Math.ceil(limit / 3))
                    .getRawMany();

                return [
                    ...addresses.map((r) => r.value),
                    ...borrowers.map((r) => r.value),
                    ...apns.map((r) => r.value),
                ].slice(0, limit);
        }
        if (userRole === UserRole.VA) {
            queryBuilder.andWhere("record.assigned_to = :userId", { userId });
        }

        queryBuilder.limit(limit).orderBy("value", "ASC");

        results = await queryBuilder.getRawMany();

        console.log(results);

        const filteredResults = results
            .map((result) => result.valueOf())
            .filter((value) => value && value.trim());

        this.logger.debug(
            `Autocomplete results for query "${query}": ${filteredResults.length} items`
        );
        console.log(filteredResults);

        await this.cache.set(
            `autocomplete:${query}`,
            filteredResults,
            this.TEN_MINUTES
        );
        return filteredResults.slice(0, limit);
    }

    // smart suggestions based on vector embeddings
    async autocompleteVectorSearch(
        query: string,
        limit: number = 10,
        username: string,
        userRole: string
    ): Promise<string[]> {
        if (!query || query.trim().length < 2) return [];

        const embedding = await this.embedder.generateVectorEmbedding(query);
        const vectorString = `[${embedding.join(",")}]`;
        let sql = `
            SELECT property_address, borrower_name, apn
            FROM records
            WHERE embedding IS NOT NULL
        `;

        const params: any[] = [vectorString];

        if (userRole === "VA") {
            sql += ` AND assigned_to = $2`;
            params.push(username);
        }

        sql += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
        params.push(this.RECORDS_PER_PAGE * 3);

        const records = await this.recordRepo.query(sql, params);

        const suggestions = new Set<string>();

        for (const r of records) {
            const decryptedAddress = this.encrypter.decrypt(r.property_address);
            const decryptedName = this.encrypter.decrypt(r.borrower_name);
            const decryptedApn = this.encrypter.decrypt(r.apn);

            [decryptedAddress, decryptedName, decryptedApn].forEach((val) => {
                if (val && val.trim()) suggestions.add(val.trim());
            });
        }
        return [...suggestions].slice(0, this.RECORDS_PER_PAGE);
    }

    // additional function to search with partial match
    // this is expensive as it decrypts all records
    // use with caution, especially with large datasets
    async searchWithPartialMatch(
        searchTerm: string,
        field: string,
        limit: number = 100
    ): Promise<Record[]> {
        let queryBuilder = this.recordRepo.createQueryBuilder("record");

        const records = await queryBuilder
            .limit(this.RECORDS_PER_PAGE)
            .getMany();

        const decryptedRecords = records.map((record) => ({
            ...record,
            property_address: this.encrypter.decrypt(record.property_address),
            borrower_name: this.encrypter.decrypt(record.borrower_name),
            apn: this.encrypter.decrypt(record.apn),
        }));

        return decryptedRecords.filter((record) => {
            const searchLower = searchTerm.toLowerCase();
            switch (field) {
                case "property_address":
                    return record.property_address
                        .toLowerCase()
                        .includes(searchLower);

                case "borrower_name":
                    return record.borrower_name
                        .toLowerCase()
                        .includes(searchLower);

                case "apn":
                    return record.apn.toLowerCase().includes(searchLower);

                default:
                    return (
                        record.property_address
                            .toLowerCase()
                            .includes(searchLower) ||
                        record.borrower_name
                            .toLowerCase()
                            .includes(searchLower) ||
                        record.apn.toLowerCase().includes(searchLower)
                    );
            }
        });
    }

    async getLockedRecords(): Promise<Record[]> {
        return this.recordRepo
            .createQueryBuilder("record")
            .where("record.locked_by IS NOT NULL")
            .andWhere("record.locked_at_timestamp IS NOT NULL")
            .orderBy("record.locked_at_timestamp DESC")
            .getMany();
    }

    // implements the non-fucntion requirement
    // "Restrict access to records based on VA assignment."
    async restrictAccessIfNotAssignedOnThisRecord(
        recordId: string,
        username: string
    ): Promise<void> {
        const record = await this.findOne(recordId);
        if (record.assigned_to !== username) {
            this.logger.warn(
                `User ${username} attempted to access record ${recordId} without being assigned`
            );
            throw new ForbiddenException("You are not assigned to this record");
        }
    }
}
