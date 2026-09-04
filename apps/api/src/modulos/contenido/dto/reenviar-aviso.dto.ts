import { CategoriaAviso } from "@app-vecinos/tipos";
import { IsIn, IsString } from "class-validator";

const CATEGORIAS_JUNTA: CategoriaAviso[] = ["junta_vecinal", "municipal", "otro"];

export class ReenviarAvisoDto {
  @IsString()
  titulo!: string;

  @IsString()
  cuerpo!: string;

  @IsIn(CATEGORIAS_JUNTA)
  categoria!: CategoriaAviso;
}
