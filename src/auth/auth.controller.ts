import { Controller, Post, Body, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "src/users/dtos/create-user.dto";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("login")
    async login(@Body() body: { username: string; password: string }) {
        const user = await this.authService.validateUser(
            body.username,
            body.password
        );
        if (!user) throw new UnauthorizedException("Invalid credentials");

        return this.authService.login(user.id, user.username, user.role);
    }

    @Post("register")
    async register(@Body() body: CreateUserDto) {
        const { username, password, role } = body;
        return await this.authService.registerUser(username, password, role);
    }
}
