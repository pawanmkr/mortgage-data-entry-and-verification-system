import { Controller, Get, Post, Body, Param, Put } from "@nestjs/common";
import { RecordsService } from "./records.service";
import { Record } from "./entities/record.entity";

@Controller("records")
export class RecordsController {
    constructor(private readonly recordsService: RecordsService) {}

    @Post()
    create(@Body() body: Partial<Record>) {
        return this.recordsService.create(body);
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.recordsService.findOne(id);
    }

    @Put(":id/lock")
    lock(@Param("id") id: string, @Body("userId") userId: string) {
        return this.recordsService.lock(id, userId);
    }
}
