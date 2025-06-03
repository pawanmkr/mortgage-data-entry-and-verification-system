import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import { ConfigService } from "@nestjs/config";

/**
 * Encountered a classical problem of security and searchability.
 * We need to encrypt sensitive data while still allowing for search operations.
 * This service provides methods to encrypt data in a way that allows for searching
 * by generating a searchable hash.
 */
@Injectable()
export class EncryptionService {
    private readonly logger = new Logger(EncryptionService.name);
    private readonly algorithm = "aes-256-gcm";
    private readonly key: Buffer;

    constructor(private readonly configService: ConfigService) {
        const keyString = configService.get<string>("ENCRYPTION_KEY");
        if (!keyString) {
            throw new Error("ENCRYPTION_KEY is not set in configuration");
        }
        this.key = Buffer.from(keyString, "hex");
    }

    encrypt(plaintext: string): {
        encrypted: string;
        searchHash: string;
    } {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(plaintext, "utf8", "hex");
        encrypted += cipher.final("hex");
        const authTag = cipher.getAuthTag();

        const searchHash = crypto
            .createHmac("sha256", this.key)
            .update(plaintext.toLowerCase())
            .digest("hex");

        return {
            encrypted:
                iv.toString("hex") +
                ":" +
                authTag.toString("hex") +
                ":" +
                encrypted,
            searchHash,
        };
    }

    decrypt(encryptedData: string): string {
        const parts = encryptedData.split(":");
        const iv = Buffer.from(parts[0], "hex");
        const authTag = Buffer.from(parts[1], "hex");
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    }

    // Generate search hash for queries
    generateSearchHash(searchTerm: string): string {
        return crypto
            .createHmac("sha256", this.key)
            .update(searchTerm.toLowerCase())
            .digest("hex");
    }
}
