import * as bcrypt from "bcrypt";
import { UserRole } from "src/users/enums/role.enum";

const users = [
    {
        username: "admin",
        password: "tinkercad",
        role: UserRole.ADMIN,
    },
    {
        username: "va_user1",
        password: "tinkercad",
        role: UserRole.VA,
    },
    {
        username: "va_user2",
        password: "tinkercad",
        role: UserRole.VA,
    },
];

export const getUsers = () => {
    return users.map(async (user) => ({
        ...user,
        password_hash: await bcrypt.hash(user.password, 10),
    }));
};
