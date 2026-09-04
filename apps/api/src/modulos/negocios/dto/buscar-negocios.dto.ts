import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class BuscarNegociosDto {
  @IsString()
  @MinLength(1)
  q!: string;

  @IsString()
  comunidadId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite: number = 20;
}
