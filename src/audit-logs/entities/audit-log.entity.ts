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

    @Column({ nullable: false })
    record_id!: string;

    @Column({ nullable: false })
    changed_by!: string;

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
