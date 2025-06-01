import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

export class SearchRecordsDto {
    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @IsString()
    field?: "property_address" | "apn" | "borrower_name" | "all";

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(0)
    offset: number = 0;
}
