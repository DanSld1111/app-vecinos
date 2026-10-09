import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, MinLength } from "class-validator";

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

  /** null u omitido = la moneda del negocio. */
  @IsOptional()
  @IsIn(["PEN", "USD", "EUR"])
  moneda?: "PEN" | "USD" | "EUR" | null;
}
