import { Controller, Post, Body, Get } from "@nestjs/common";
import { BatchesService } from "./batches.service";

@Controller("batches")
export class BatchesController {
    constructor(private readonly service: BatchesService) {}

    @Post()
    create(
        @Body() body: { batch_name: string; batch_type: "Daily" | "Weekly" }
    ) {
        return this.service.createBatch(body);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }
}
