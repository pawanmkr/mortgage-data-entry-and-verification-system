import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "typeorm";

@Entity("audit_logs")
export class AuditLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    record_id!: string;

    @Column()
    user_id!: string;

    @Column()
    action!: "Create" | "Edit" | "Verify" | "Flag";

    @Column({ nullable: true })
    field_name!: string;

    @Column({ nullable: true, type: "text" })
    old_value!: string;

    @Column({ nullable: true, type: "text" })
    new_value!: string;

    @CreateDateColumn()
    timestamp!: Date;
}
