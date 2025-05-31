import {
    IsEnum,
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from "class-validator";
import { UserRole } from "../enums/role.enum";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    @MaxLength(20)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores",
    })
    username!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsEnum(UserRole, {
        message: `Valid roles are ${UserRole.ADMIN}, ${UserRole.VA}`,
    })
    role!: UserRole;
}
