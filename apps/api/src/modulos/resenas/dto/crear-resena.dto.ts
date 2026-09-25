import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { Calificacion } from "@app-vecinos/tipos";

const CALIFICACIONES: Calificacion[] = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export class CrearResenaDto {
  @IsString()
  negocioId!: string;

  @IsIn(CALIFICACIONES)
  calificacion!: Calificacion;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}
