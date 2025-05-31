import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../src/auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../src/users/entities/user.entity";
import * as bcrypt from "bcrypt";

describe("AuthService", () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                JwtService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn().mockResolvedValue({
                            id: "123",
                            username: "test",
                            password_hash: await bcrypt.hash("secret", 10),
                            role: "VA",
                        }),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue("fake-jwt-token"),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it("should validate and login a user", async () => {
        const user = await service.validateUser("test", "secret");
        expect(user).toHaveProperty("username");
        const token = await service.login(user);
        expect(token).toHaveProperty("access_token");
    });
});
