import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ListarNegociosDto {
  @IsString()
  comunidadId!: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  /** Pantalla de un servicio (Restaurantes, Market Space…) en vez de una categoría suelta —
   * trae los negocios de TODAS las categorías de ese servicio. Ver
   * docs/decisiones/0072-servicio-dueno-de-categoria.md. */
  @IsOptional()
  @IsString()
  servicioSlug?: string;

  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite: number = 20;
}
