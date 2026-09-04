import { ArrayMinSize, IsArray, IsDateString, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { UbicacionAnuncio } from "@app-vecinos/tipos";

const UBICACIONES: UbicacionAnuncio[] = ["carrusel_inicio", "banner_buscar"];

export class CrearAnuncioDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  detalle!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(UBICACIONES, { each: true })
  ubicaciones!: UbicacionAnuncio[];

  @IsOptional()
  @IsString()
  negocioId?: string | null;

  @IsDateString()
  fechaInicio!: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string | null;
}
