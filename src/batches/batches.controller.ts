import { Controller, Post, Body, Get, UseGuards } from "@nestjs/common";
import { BatchesService } from "./batches.service";
import { BatchType } from "./enums/batch-type.enum";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { UserRole } from "src/users/enums/role.enum";

@Controller("batches")
export class BatchesController {
    constructor(private readonly service: BatchesService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    create(@Body() body: { name: string; type: BatchType }) {
        return this.service.createBatch(body.name, body.type);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.service.findAll();
    }
}
