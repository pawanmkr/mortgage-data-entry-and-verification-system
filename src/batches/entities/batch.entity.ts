import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "typeorm";

@Entity("batches")
export class Batch {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    batch_name!: string;

    @Column()
    batch_type!: "Daily" | "Weekly";

    @CreateDateColumn()
    created_at!: Date;
}
