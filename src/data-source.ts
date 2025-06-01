import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export default new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT ? +process.env.DATABASE_PORT : 5432,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [__dirname + "/**/*.entity.{ts,js}"],
    migrations: [__dirname + "/migrations/*.{ts,js}"],
    migrationsTableName: "migrations",
});
