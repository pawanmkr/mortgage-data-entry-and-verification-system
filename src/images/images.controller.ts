import {
    Controller,
    Post,
    Get,
    Param,
    Res,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    NotFoundException,
    UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { ImagesService } from "./images.service";
import { Response } from "express";
import * as path from "path";
import * as fs from "fs";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@Controller("images")
export class ImagesController {
    constructor(private readonly imagesService: ImagesService) {}

    @Post("upload")
    @UseInterceptors(
        FileInterceptor("file", {
            storage: diskStorage({
                destination: "./uploads/tiffs",
                filename: (req, file, cb) => {
                    const name = file.originalname.replace(/\s+/g, "_");
                    cb(null, Date.now() + "-" + name);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (
                    file.mimetype === "image/tiff" ||
                    file.originalname.endsWith(".tif") ||
                    file.originalname.endsWith(".tiff")
                ) {
                    cb(null, true);
                } else {
                    cb(
                        new BadRequestException("Only TIFF files are allowed"),
                        false
                    );
                }
            },
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        })
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        return {
            message: "File uploaded successfully",
            filename: file.filename,
        };
    }

    @Get("list")
    listFiles() {
        return this.imagesService.listFiles();
    }

    @Get("download/:filename")
    // @UseGuards(JwtAuthGuard)
    downloadFile(@Param("filename") filename: string, @Res() res: Response) {
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "uploads",
            "tiffs",
            filename
        );
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException("File not found");
        }
        res.download(filePath);
    }
}
