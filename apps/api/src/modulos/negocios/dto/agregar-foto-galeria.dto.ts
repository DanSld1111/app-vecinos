import { IsString, MinLength } from "class-validator";

/** Usado también para borrar una foto de la galería (identifica cuál por su URL). */
export class AgregarFotoGaleriaDto {
  @IsString()
  @MinLength(1)
  url!: string;
}
