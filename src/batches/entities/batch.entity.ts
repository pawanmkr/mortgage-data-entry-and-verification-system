import { Record } from "src/records/entities/record.entity";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from "typeorm";
import { BatchType } from "../enums/batch-type.enum";

@Entity("batches")
export class Batch {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @OneToMany(() => Record, (record) => record.batch)
    records!: Record[];

    @Column({ unique: true })
    name!: string;

    @Column({ nullable: false })
    type!: BatchType;

    @CreateDateColumn()
    created_at!: Date;
}
