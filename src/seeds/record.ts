import { RecordVerificationStatus } from "src/records/enums/record-verification-status.enum";
import { Record } from "src/records/entities/record.entity";

export const getRecords = (userIds: string[]): Partial<Record>[] => {
    const addresses = [
        "123 Main St, Springfield",
        "456 Oak Ave, Centerville",
        "789 Pine Dr, Lakeside",
        "101 Maple Rd, Rivertown",
        "202 Birch Blvd, Hillview",
    ];

    const records: Partial<Record>[] = [];

    for (let i = 0; i < 5; i++) {
        const userId = userIds[i % userIds.length];
        records.push({
            entered_by: userId,
            assigned_to: userId,
            property_address: addresses[i % addresses.length],
            transaction_date: new Date(),
            borrower_name: `Borrower ${i + 1}`,
            loan_amount: 100000 + i * 10000,
            sales_price: 120000 + i * 10000,
            down_payment: 20000,
            apn: `APN-${i + 100}`,
            status: RecordVerificationStatus.PENDING,
            entered_by_date: new Date(),
        });
    }

    return records;
};
