import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CrearCategoriaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre!: string;

  @IsString()
  @MinLength(1)
  icono!: string;

  @IsOptional()
  @IsString()
  arquetipoId?: string | null;

  @IsOptional()
  @IsString()
  servicioSlug?: string | null;
}
