import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { EstadoServicioApp } from "@app-vecinos/tipos";
import { TIPOS_FICHA } from "../../categorias/dto/campo-producto.dto";

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

  /** Ficha por defecto de sus categorías. null = no es un directorio de negocios. */
  @IsOptional()
  @IsIn(TIPOS_FICHA)
  ficha?: (typeof TIPOS_FICHA)[number] | null;
}
