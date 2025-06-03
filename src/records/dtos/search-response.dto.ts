import { RecordInterface } from "../interfaces/record.interface";

export class SearchResponseDto {
    total!: number;
    records!: RecordInterface[];
    hasMore!: boolean;
}
