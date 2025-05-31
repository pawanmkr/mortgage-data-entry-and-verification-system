export interface UserInterface {
    id: string;
    username: string;
    password_hash: string;
    role: "Admin" | "VA";
}
