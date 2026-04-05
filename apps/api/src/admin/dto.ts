import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ enum: ["PARENT", "TRAINER", "ADMIN"] })
  @IsOptional()
  @IsIn(["PARENT", "TRAINER", "ADMIN"])
  role?: "PARENT" | "TRAINER" | "ADMIN";
}

export class CatalogMediaInputDto {
  @ApiProperty({ enum: ["IMAGE", "AUDIO", "VIDEO", "EXTERNAL_LINK"] })
  @IsIn(["IMAGE", "AUDIO", "VIDEO", "EXTERNAL_LINK"])
  kind!: "IMAGE" | "AUDIO" | "VIDEO" | "EXTERNAL_LINK";

  @ApiProperty()
  @IsUrl()
  externalUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;
}

export class DifficultyLevelInputDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateTaskCatalogDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  focusPoints?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  demoVideoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultSongId?: string;

  @ApiPropertyOptional({ type: [CatalogMediaInputDto] })
  @IsOptional()
  @IsArray()
  mediaLinks?: CatalogMediaInputDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentIds?: string[];

  @ApiPropertyOptional({ type: [DifficultyLevelInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DifficultyLevelInputDto)
  difficultyLevels?: DifficultyLevelInputDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTaskCatalogDto extends CreateTaskCatalogDto {}

export class CreateSongCatalogDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lyrics?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  audioExternalUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  videoExternalUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSongCatalogDto extends CreateSongCatalogDto {}

export class CreateEquipmentCatalogDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  iconExternalUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEquipmentCatalogDto extends CreateEquipmentCatalogDto {}
