import { CategoriaAviso } from "@app-vecinos/tipos";
import { IsBoolean, IsIn, IsString } from "class-validator";

const CATEGORIAS: CategoriaAviso[] = ["municipal", "junta_vecinal", "seguridad", "otro"];

export class CrearAvisoDirectoDto {
  @IsString()
  comunidadId!: string;

  @IsString()
  fuenteNombre!: string;

  @IsBoolean()
  fuenteVerificada!: boolean;

  @IsString()
  titulo!: string;

  @IsString()
  cuerpo!: string;

  @IsIn(CATEGORIAS)
  categoria!: CategoriaAviso;
}
