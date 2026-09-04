import { ArrayMinSize, IsArray, IsOptional, IsString } from "class-validator";

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
}
