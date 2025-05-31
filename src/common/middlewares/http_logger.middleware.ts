import { Request, Response, NextFunction } from "express";
import { Injectable, NestMiddleware, Logger } from "@nestjs/common";

@Injectable()
export class HttpLogger implements NestMiddleware {
    private readonly logger = new Logger("HTTP");

    use(request: Request, response: Response, next: NextFunction): void {
        const { ip, method, originalUrl } = request;
        const startTime = process.hrtime(); // High-resolution time

        response.on("finish", () => {
            const { statusCode } = response;
            const diff = process.hrtime(startTime);
            const elapsedMs = diff[0] * 1000 + diff[1] / 1e6; // Convert to milliseconds
            const elapsedSec = (elapsedMs / 1000).toFixed(2); // Convert to seconds with 2 decimal places

            this.logger.log(
                `${method} ${originalUrl} ${statusCode} - ${elapsedMs.toFixed(
                    2
                )}ms (${elapsedSec}sec) ${ip}`
            );
        });

        next();
    }
}
