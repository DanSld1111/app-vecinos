import { CategoriaAviso } from "@app-vecinos/tipos";
import { IsIn, IsString } from "class-validator";

// "seguridad" queda reservada para el aviso directo del super-admin (Serenazgo/Municipalidad) —
// mismo criterio que ya aplicaba CATEGORIAS_JUNTA en apps/admin/src/paginas/MisAvisos.tsx.
const CATEGORIAS_JUNTA: CategoriaAviso[] = ["junta_vecinal", "municipal", "otro"];

export class EnviarAValidacionDto {
  @IsString()
  comunidadId!: string;

  @IsString()
  fuenteNombre!: string;

  @IsString()
  titulo!: string;

  @IsString()
  cuerpo!: string;

  @IsIn(CATEGORIAS_JUNTA)
  categoria!: CategoriaAviso;
}
