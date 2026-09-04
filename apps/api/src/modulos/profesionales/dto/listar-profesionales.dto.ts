import { TipoProfesional } from "@app-vecinos/tipos";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const TIPOS: TipoProfesional[] = ["medico", "veterinario", "legal_contable"];

export class ListarProfesionalesDto {
  @IsString()
  comunidadId!: string;

  @IsOptional()
  @IsIn(TIPOS)
  tipo?: TipoProfesional;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite: number = 20;
}
