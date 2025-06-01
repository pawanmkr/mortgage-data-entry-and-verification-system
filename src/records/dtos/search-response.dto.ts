import { AutoCompleteResponseDto } from "./autocomplete-response.dto";

export class SearchResponseDto {
    total!: number;
    records!: AutoCompleteResponseDto[];
    hasMore!: boolean;
}
