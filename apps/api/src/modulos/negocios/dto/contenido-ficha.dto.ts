import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

/** Un renglón de la ficha "Servicios y tarifas". */
export class ServicioOfrecidoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  detalle?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio!: number;

  /** URL devuelta por POST :id/servicios/foto. La API solo acepta fotos de su propio almacenamiento. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fotoUrl?: string | null;
}

/** La lista completa: se guarda tal cual, en este orden (reemplaza la anterior). */
export class GuardarServiciosDto {
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ServicioOfrecidoDto)
  servicios!: ServicioOfrecidoDto[];
}

/** Rubros (ficha "Rubros") o pasillos (ficha "Ofertas y pasillos"): nombres cortos, en orden. */
export class GuardarListaTextoDto {
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(40, { each: true })
  items!: string[];
}
