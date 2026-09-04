import { IsString, MinLength } from "class-validator";

export class RechazarAvisoDto {
  @IsString()
  @MinLength(1)
  motivo!: string;
}
