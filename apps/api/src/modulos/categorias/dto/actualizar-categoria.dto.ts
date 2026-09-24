import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class ActualizarCategoriaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre?: string;

  @IsOptional()
  @IsString()
  icono?: string;

  @IsOptional()
  @IsString()
  arquetipoId?: string | null;

  @IsOptional()
  @IsString()
  servicioSlug?: string | null;
}
