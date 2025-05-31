import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { LogLevel, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const logLevelsString = configService.get<string>("LOG_LEVELS");

    if (logLevelsString) {
        const logLevels = logLevelsString
            .split(",")
            .map((level) => level.trim()) as LogLevel[];
        app.useLogger(logLevels);
    }

    app.useGlobalPipes(new ValidationPipe());
    await app.listen(3000);
}
bootstrap();
