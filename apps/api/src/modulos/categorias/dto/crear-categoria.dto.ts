import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";
import { CampoProductoDto, TIPOS_FICHA } from "./campo-producto.dto";

export class CrearCategoriaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre!: string;

  @IsString()
  @MinLength(1)
  icono!: string;

  @IsOptional()
  @IsString()
  servicioSlug?: string | null;

  /** null = hereda la ficha del servicio. */
  @IsOptional()
  @IsIn(TIPOS_FICHA)
  ficha?: (typeof TIPOS_FICHA)[number] | null;

  /** Vacío o null = usa el título de la ficha. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  tituloSeccion?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => CampoProductoDto)
  atributosProducto?: CampoProductoDto[];
}
