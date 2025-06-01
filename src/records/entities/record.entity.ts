import pgvector from "pgvector";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { RecordVerificationStatus } from "../enums/record-verification-status.enum";
import { User } from "../../users/entities/user.entity";
import { Batch } from "src/batches/entities/batch.entity";
import { AuditLog } from "src/audit-logs/entities/audit-log.entity";

@Entity("records")
export class Record {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, (user) => user.assigned_records)
    assigned_to!: string;

    @ManyToOne(() => User, (user) => user.created_records)
    entered_by!: string;

    @ManyToOne(() => Batch, (batch) => batch.records, { nullable: true })
    @JoinColumn({ name: "batch_id" })
    batch!: Batch | null;

    @Column({ nullable: true })
    batch_id!: string | null;

    @OneToMany(() => AuditLog, (audit_log) => audit_log.record_id)
    audit_logs!: AuditLog[];

    @Column()
    property_address!: string;

    @Column({ type: "date" })
    transaction_date!: Date;

    @Column()
    borrower_name!: string;

    @Column("decimal")
    loan_amount!: number;

    @Column("decimal")
    sales_price!: number;

    @Column("decimal")
    down_payment!: number;

    @Column()
    apn!: string;

    @Column({ default: RecordVerificationStatus.PENDING })
    status!: RecordVerificationStatus;

    @Column({ nullable: true, type: "varchar" })
    locked_by!: string | null;

    @Column({ nullable: true, type: "timestamp" })
    lock_timestamp!: Date | null;

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
