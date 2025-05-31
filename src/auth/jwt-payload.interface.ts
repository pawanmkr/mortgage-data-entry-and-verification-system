import { UserRole } from "src/users/enums/role.enum";

export interface JwtPayload {
    username: string;
    sub: string;
    role: UserRole;
}
