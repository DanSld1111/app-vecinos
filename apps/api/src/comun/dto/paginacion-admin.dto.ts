import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * Query params comunes para los listados del panel admin que antes traían todo sin límite
 * (negocios/admin, cuentas, usuarios) — ver docs/decisiones/0021-endurecimiento-post-diagnostico.md.
 * Límite generoso por defecto (100): con el volumen de datos actual del piloto, en la práctica
 * todo entra en una sola página: "cargar más" solo se activa de verdad una vez que un listado
 * realmente supere el límite.
 */
export class PaginacionAdminDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limite: number = 100;
}
