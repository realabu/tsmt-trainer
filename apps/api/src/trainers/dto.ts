import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsString } from "class-validator";

export class CreateTrainerAssignmentDto {
  @ApiProperty()
  @IsString()
  childId!: string;

  @ApiProperty()
  @IsString()
  routineId!: string;

  @ApiProperty()
  @IsEmail()
  trainerEmail!: string;

  @ApiProperty({ enum: ["PENDING", "ACTIVE"] })
  @IsIn(["PENDING", "ACTIVE"])
  status!: "PENDING" | "ACTIVE";
}
