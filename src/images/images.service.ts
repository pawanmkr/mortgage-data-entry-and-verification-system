import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class ImagesService {
    private readonly uploadDir = path.join(
        __dirname,
        "..",
        "..",
        "uploads",
        "tiffs"
    );

    getFilePath(filename: string): string {
        return path.join(this.uploadDir, filename);
    }

    listFiles(): string[] {
        return fs
            .readdirSync(this.uploadDir)
            .filter((file) => file.endsWith(".tiff") || file.endsWith(".tif"));
    }
}
