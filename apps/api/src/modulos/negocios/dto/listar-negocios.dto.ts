import { Type } from "class-transformer";
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, Min } from "class-validator";

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

  /** Ubicación real del vecino — si vienen los dos, se ordena por distancia real (con tope) en
   * vez de por fecha de alta. Ver docs/decisiones/0073-inicio-orden-real.md. */
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;
}
