import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { CoordenadaDto } from "./coordenada.dto";

export class CrearNegocioDto {
  @IsString()
  nombre!: string;

  @IsString()
  distritoUbigeo!: string;

  @IsString()
  comunidadId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  categoriaIds!: string[];

  @IsString()
  direccion!: string;

  @IsOptional()
  @IsString()
  telefono?: string | null;

  @IsOptional()
  @IsString()
  whatsapp?: string | null;

  /** Si no viene, se usa el centro de la comunidad como aproximación (se corrige después en la ficha). */
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordenadaDto)
  coordenada?: CoordenadaDto;
}
