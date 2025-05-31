import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from "typeorm";
import { UserRole } from "../enums/role.enum";
import { Record } from "../../records/entities/record.entity";
import { AuditLog } from "src/audit-logs/entities/audit-log.entity";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    username!: string;

    @Column()
    password_hash!: string;

    @Column()
    role!: UserRole;

    @OneToMany(() => Record, (record) => record.entered_by)
    created_records!: Record[];

    @OneToMany(() => Record, (record) => record.assigned_to)
    assigned_records!: Record[];

    @OneToMany(() => AuditLog, (audit_log) => audit_log.user_id)
    audit_logs!: AuditLog[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
