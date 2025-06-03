import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "typeorm";
import { BatchType } from "../enums/batch-type.enum";

@Entity("batches")
export class Batch {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    name!: string;

    @Column({ nullable: false })
    type!: BatchType;

    @CreateDateColumn()
    created_at!: Date;
}
