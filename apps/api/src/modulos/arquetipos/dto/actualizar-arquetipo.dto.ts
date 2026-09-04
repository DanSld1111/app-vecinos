import { ArrayMinSize, IsArray, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CampoArquetipoDto } from "./campo-arquetipo.dto";

export class ActualizarArquetipoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  icono?: string;

  // No incluye plantillaId a propósito: ver comentario en arquetipos.service.ts — no se puede
  // cambiar la plantilla de un arquetipo ya creado.
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CampoArquetipoDto)
  campos?: CampoArquetipoDto[];
}
