import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from "typeorm";
import { VA_ACTION } from "../enums/va-action.enum";
import { Record } from "src/records/entities/record.entity";
import { User } from "src/users/entities/user.entity";

@Entity("audit_logs")
export class AuditLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Record, (record) => record.audit_logs)
    record_id!: string;

    @ManyToOne(() => User, (user) => user.audit_logs)
    user_id!: string;

    @Column({ nullable: false })
    action!: VA_ACTION;

    @Column({ nullable: true })
    field_name!: string;

    @Column({ nullable: true, type: "text" })
    old_value!: string;

    @Column({ nullable: true, type: "text" })
    new_value!: string;

    @CreateDateColumn()
    timestamp!: Date;
}
