import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

/** Mismos campos al crear y al editar. Qué campo es obligatorio depende del tipo (lo revisa el servicio). */
export class GuardarPublicacionDto {
  @IsIn(["texto", "fotos", "video", "youtube"])
  tipo!: "texto" | "fotos" | "video" | "youtube";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  texto?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  fotos?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(600)
  videoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  portadaUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  enlaceUrl?: string | null;

  @IsIn(["borrador", "publicada"])
  estado!: "borrador" | "publicada";

  @IsOptional()
  @IsBoolean()
  permiteComentarios?: boolean;

  /** 0 = sin destacar; 1 a 7 = destacada esa cantidad de días desde ahora. Omitido = no se toca. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7)
  diasDestacada?: number;
}

export class EnlaceYoutubeDto {
  @IsString()
  @MaxLength(400)
  enlace!: string;
}

export class FirmarVideoDto {
  @IsString()
  @MaxLength(200)
  nombre!: string;
}

export class ComentarDto {
  @IsString()
  @MaxLength(500)
  texto!: string;
}

export class OcultarComentarioDto {
  @IsBoolean()
  oculto!: boolean;
}

export class ActualizarModuloDto {
  @IsBoolean()
  activo!: boolean;
}
