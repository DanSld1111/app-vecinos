import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { UbicacionAnuncio } from "@app-vecinos/tipos";

const UBICACIONES: UbicacionAnuncio[] = ["carrusel_inicio", "banner_buscar"];

export class ActualizarAnuncioDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  detalle?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(UBICACIONES, { each: true })
  ubicaciones?: UbicacionAnuncio[];

  @IsOptional()
  @IsString()
  negocioId?: string | null;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
