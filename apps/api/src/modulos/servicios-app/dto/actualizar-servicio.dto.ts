import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { EstadoServicioApp } from "@app-vecinos/tipos";

export class ActualizarServicioDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @IsOptional()
  @IsIn(["disponible", "proximamente"])
  estado?: EstadoServicioApp;
}
