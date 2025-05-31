import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("records")
export class Record {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

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

    @Column({ default: "Pending" })
    status!: "Pending" | "Verified" | "Flagged";

    @Column({ nullable: true })
    locked_by!: string;

    @Column({ nullable: true, type: "timestamp" })
    lock_timestamp!: Date;

    @Column()
    entered_by!: string;

    @Column({ type: "timestamp" })
    entered_by_date!: Date;

    @Column({ nullable: true })
    reviewed_by!: string;

    @Column({ nullable: true, type: "timestamp" })
    reviewed_by_date!: Date;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
