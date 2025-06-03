import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm";
import { RecordVerificationStatus } from "../enums/record-verification-status.enum";

@Entity("records")
export class Record {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ nullable: true })
    assigned_to!: string;

    @Column({ type: "uuid", nullable: true })
    batch_id!: string | null;

    @Column()
    property_address!: string;

    @Column()
    @Index() // for fast searching
    property_address_hash!: string; // HMAC hash for searching

    @Column({ type: "date" })
    transaction_date!: Date;

    @Column()
    borrower_name!: string;

    @Column()
    @Index()
    borrower_name_hash!: string;

    @Column("decimal")
    loan_amount!: number;

    @Column("decimal")
    sales_price!: number;

    @Column("decimal")
    down_payment!: number;

    @Column()
    apn!: string;

    @Column()
    @Index()
    apn_hash!: string;

    @Column({ default: RecordVerificationStatus.PENDING })
    status!: RecordVerificationStatus;

    @Column({ nullable: true })
    tiff_image_path!: string;

    @Column({ nullable: true })
    tiff_original_name!: string;

    @Column({ nullable: true, type: "varchar" })
    locked_by!: string | null;

    @Column({ nullable: true, type: "timestamp" })
    lock_timestamp!: Date | null;

    @Column()
    entered_by!: string;

    @Column({ type: "timestamp" })
    entered_by_date!: Date;

    @Column({ nullable: true, type: "varchar" })
    reviewed_by!: string | null;

    @Column({ nullable: true, type: "timestamp" })
    reviewed_by_date!: Date | null;

    @Column({ nullable: true })
    embedding!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
