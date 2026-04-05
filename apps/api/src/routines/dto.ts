import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateRoutineTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  catalogTaskId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  catalogDifficultyLevelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  songId?: string;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coachText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repetitionsLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repetitionSchemeRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  repetitionCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  repetitionUnitCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  customImageExternalUrl?: string;

  @ApiPropertyOptional({
    type: [Object],
    example: [
      { kind: "IMAGE", label: "Mutatott kep", externalUrl: "https://example.com/image.jpg" },
    ],
  })
  @IsOptional()
  @IsArray()
  mediaLinks?: Array<{
    kind: "IMAGE" | "AUDIO" | "VIDEO" | "EXTERNAL_LINK";
    label?: string;
    externalUrl: string;
  }>;
}

export class UpdateRoutineTaskDto extends CreateRoutineTaskDto {}

export class CreateRoutinePeriodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsDateString()
  startsOn!: string;

  @ApiProperty()
  @IsDateString()
  endsOn!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  weeklyTargetCount!: number;
}

export class UpdateRoutinePeriodDto extends CreateRoutinePeriodDto {}

export class CreateRoutineDto {
  @ApiProperty()
  @IsString()
  childId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [CreateRoutineTaskDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoutineTaskDto)
  tasks!: CreateRoutineTaskDto[];

  @ApiProperty({ type: [CreateRoutinePeriodDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoutinePeriodDto)
  periods!: CreateRoutinePeriodDto[];
}

export class UpdateRoutineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
