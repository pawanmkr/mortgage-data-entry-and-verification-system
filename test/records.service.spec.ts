import { Test, TestingModule } from "@nestjs/testing";
import { RecordsService } from "../src/records/records.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Record } from "../src/records/entities/record.entity";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { RecordVerificationStatus } from "../src/records/enums/record-verification-status.enum";

describe("RecordsService", () => {
    let service: RecordsService;
    let repo: Repository<Record>;

    const record: Record = {
        id: "1",
        property_address: "123 Main St",
        transaction_date: new Date(),
        borrower_name: "John Doe",
        loan_amount: 100000,
        sales_price: 120000,
        down_payment: 20000,
        apn: "APN123",
        status: RecordVerificationStatus.PENDING,
        locked_by: "",
        lock_timestamp: null,
        entered_by: "admin",
        entered_by_date: new Date(),
        reviewed_by: null,
        reviewed_by_date: null,
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RecordsService,
                {
                    provide: getRepositoryToken(Record),
                    useValue: {
                        create: jest
                            .fn()
                            .mockImplementation((dto) => ({ ...dto })),
                        save: jest
                            .fn()
                            .mockImplementation((r) => Promise.resolve(r)),
                        findOne: jest
                            .fn()
                            .mockImplementation(({ where: { id } }) => {
                                if (id === record.id)
                                    return Promise.resolve({ ...record });
                                return Promise.resolve(null);
                            }),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                        getOrThrow: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get<RecordsService>(RecordsService);
        repo = module.get<Repository<Record>>(getRepositoryToken(Record));
    });

    it("should lock a record if not locked", async () => {
        const result = await service.lock(record.id, "va1");
        expect(result && result.locked_by).toBe("va1");
        expect(result && result.lock_timestamp).toBeInstanceOf(Date);
    });

    it("should not lock a record if already locked and not expired", async () => {
        const lockedRecord = {
            ...record,
            locked_by: "va2",
            lock_timestamp: new Date(),
        };
        jest.spyOn(repo, "findOne").mockResolvedValueOnce(lockedRecord as any);
        const result = await service.lock(record.id, "va1");
        expect(result).toBeNull();
    });

    it("should clear expired lock and relock", async () => {
        const oldDate = new Date(Date.now() - 11 * 60 * 1000);
        const expiredRecord = {
            ...record,
            locked_by: "va2",
            lock_timestamp: oldDate,
        };
        jest.spyOn(repo, "findOne").mockResolvedValueOnce(expiredRecord as any);
        const result = await service.lock(record.id, "va1");
        expect(result && result.locked_by).toBe("va1");
    });

    it("should unlock a record (admin)", async () => {
        const lockedRecord = {
            ...record,
            locked_by: "va2",
            lock_timestamp: new Date(),
        };
        jest.spyOn(repo, "findOne").mockResolvedValueOnce(lockedRecord as any);
        const result = await service.unlock(record.id);
        expect(result && result.locked_by).toBe("");
        expect(result && result.lock_timestamp).toBeNull();
    });

    it("should reassign a record (admin)", async () => {
        const lockedRecord = {
            ...record,
            locked_by: "va2",
            lock_timestamp: new Date(),
        };
        jest.spyOn(repo, "findOne").mockResolvedValueOnce(lockedRecord as any);
        const result = await service.reassign(record.id, "va3");
        expect(result && result.locked_by).toBe("va3");
        expect(result && result.lock_timestamp).toBeInstanceOf(Date);
    });
});
