import { Record } from "../src/records/entities/record.entity";

describe("Record Entity", () => {
    it("should correctly calculate down payment", () => {
        const record = new Record();
        record.sales_price = 500000;
        record.loan_amount = 400000;
        record.down_payment = record.sales_price - record.loan_amount;
        expect(record.down_payment).toBe(100000);
    });
});
