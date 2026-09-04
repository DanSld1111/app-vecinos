import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, MinLength } from "class-validator";

export class AgregarOfertaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @Type(() => Number)
  @IsNumber()
  precio!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  precioOriginal?: number;

  @IsString()
  etiqueta!: string;
}
