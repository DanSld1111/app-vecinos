import { IsNumber, Max, Min } from "class-validator";

/** Punto exacto del negocio en el mapa. Rangos = límites reales de latitud/longitud. */
export class CoordenadaDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}
