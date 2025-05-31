import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../users/entities/user.entity";
import { UserRole } from "src/users/enums/role.enum";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private configService: ConfigService
    ) {}

    async validateUser(username: string, password: string) {
        const user = await this.userRepository.findOne({ where: { username } });
        if (!user) {
            this.logger.debug(`User does not exist`);
            return null;
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            this.logger.debug(`Password did not matched`);
            return null;
        }
        const { password_hash, ...result } = user;
        return result;
    }

    async login(id: string, username: string, role: UserRole) {
        const payload = { username: username, sub: id, role: role };
        return {
            access_token: this.jwtService.sign(payload, {
                secret: this.configService.getOrThrow("JWT_SECRET"),
            }),
        };
    }

    async registerUser(username: string, password: string, role: UserRole) {
        this.logger.debug(`Registering user: ${username} as ${role}`);

        const existing = await this.userRepository.findOne({
            where: { username },
        });
        if (existing) {
            this.logger.warn(`Username already exists: ${username}`);
            throw new ConflictException("Username already exists");
        }

        const password_hash = await bcrypt.hash(password, 10);
        const newUser = this.userRepository.create({
            username,
            password_hash,
            role,
        });

        const savedUser = await this.userRepository.save(newUser);
        this.logger.log(`User registered with ID: ${savedUser.id}`);

        return await this.login(
            savedUser.id,
            savedUser.username,
            savedUser.role
        );
    }
}
