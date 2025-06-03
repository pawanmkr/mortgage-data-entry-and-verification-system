import { Injectable } from "@nestjs/common";

@Injectable()
export class EmbeddingsService {
    private embedder: any;
    private queryCache = new Map<string, number[]>();

    async onModuleInit() {
        // the transformer model initialized on module init for faster search
        const TransformersApi = Function(
            'return import("@xenova/transformers")'
        )();
        const { pipeline } = await TransformersApi;

        this.embedder = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        );
    }

    async generateVectorEmbedding(text: string): Promise<number[]> {
        if (this.queryCache.has(text)) {
            return this.queryCache.get(text)!;
        }
        const output = await this.embedder(text, {
            pooling: "mean",
            normalize: true,
        });
        return Array.from(output.data);
    }
}
