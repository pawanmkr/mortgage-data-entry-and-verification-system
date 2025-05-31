import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";
import { BatchType } from "../enums/batch-type.enum";

export class CreateBatchDto {
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    name!: string;

    @IsEnum(BatchType, {
        message: `Valid roles are ${BatchType.DAILY}, ${BatchType.WEEKLY}`,
    })
    type!: BatchType;
}
