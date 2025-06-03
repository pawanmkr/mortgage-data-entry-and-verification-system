import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { RecordsModule } from "src/records/records.module";
import { UsersModule } from "src/users/users.module";

@Module({
    imports: [RecordsModule, UsersModule],
    providers: [TaskService],
})
export class TaskModule {}
