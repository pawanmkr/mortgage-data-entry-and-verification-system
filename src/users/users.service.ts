import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { UserRole } from "./enums/role.enum";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    findOne(id: string) {
        return this.userRepository.findOne({ where: { id } });
    }

    findOneWithoutPassword(id: string) {
        return this.userRepository.findOne({
            select: {
                id: true,
                username: true,
                role: true,
                created_at: true,
                updated_at: true,
            },
            where: { id },
        });
    }

    async getLeastAssignedVa(): Promise<User | null> {
        return this.userRepository.findOne({
            where: { role: UserRole.VA },
            order: { total_assigned_records: "ASC" },
        });
    }
}
