import { Record } from "../entities/record.entity";

export type CreateRecordDto = Pick<
    Record,
    | "property_address"
    | "transaction_date"
    | "borrower_name"
    | "loan_amount"
    | "sales_price"
    | "down_payment"
    | "apn"
>;
