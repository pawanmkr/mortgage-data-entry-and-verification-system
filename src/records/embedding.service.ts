import { Injectable } from "@nestjs/common";
import { execSync } from "child_process";

@Injectable()
export class EmbeddingsService {
    async generateVectorEmbedding(text: string): Promise<number[]> {
        const command = `python3 embed_text.py "${text.replace(/"/g, "")}"`;
        const output = execSync(command).toString().trim();
        try {
            return JSON.parse(output);
        } catch (err) {
            console.error("Failed to parse embedding JSON:", output);
            throw err;
        }
    }
}
