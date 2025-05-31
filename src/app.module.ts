import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RecordsModule } from "./records/records.module";
import { BatchesModule } from "./batches/batches.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { HttpLogger } from "./common/middlewares/http_logger.middleware";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: "postgres",
                host: configService.getOrThrow("DATABASE_HOST"),
                port: +configService.getOrThrow("DATABASE_PORT"),
                username: configService.getOrThrow("DATABASE_USER"),
                password: configService.getOrThrow("DATABASE_PASSWORD"),
                database: configService.getOrThrow("DATABASE_NAME"),
                entities: [__dirname + "/**/*.entity.{ts,js}"],
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false,
                    },
                },
                models: [],
                pool: {
                    max: 64,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
                define: {
                    underscored: true,
                    timestamps: true,
                    freezeTableName: true,
                    deletedAt: true,
                    paranoid: true,
                },
                logQueryParameters: true,
                benchmark: true,
                logging: false,
                autoLoadEntities: true,
                synchronize: configService.getOrThrow("NODE_ENV"),
                retryAttempts: 0,
                retryDelay: 2000,
            }),
        }),
        AuthModule,
        UsersModule,
        RecordsModule,
        BatchesModule,
        AuditLogsModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(HttpLogger).forRoutes("*");
    }
}
