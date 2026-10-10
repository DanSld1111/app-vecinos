import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

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

  /** Fecha y hora en que sale sola (decisión 0092). null = publicar ya; omitido = no cambia. */
  @IsOptional()
  @IsISO8601()
  programadaPara?: string | null;
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

  /** Id del comentario al que responde. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  respuestaA?: string;
}

export class ComentarElisurDto extends ComentarDto {
  /** Fija el hilo arriba de todo. */
  @IsOptional()
  @IsBoolean()
  fijar?: boolean;
}

export class ReportarComentarioDto {
  @IsOptional()
  @IsIn(["publicidad", "ofensivo", "enganoso", "otro"])
  motivo?: "publicidad" | "ofensivo" | "enganoso" | "otro";
}

export class ModerarComentarioDto {
  @IsOptional()
  @IsBoolean()
  oculto?: boolean;

  @IsOptional()
  @IsBoolean()
  revisado?: boolean;
}

export class FijarComentarioDto {
  @IsBoolean()
  fijado!: boolean;
}

export class SilenciarDto {
  @IsString()
  @MaxLength(80)
  usuarioId!: string;

  /** 0 = quitar el silencio. */
  @IsInt()
  @Min(0)
  @Max(30)
  dias!: number;
}

export class PermitirComentariosDto {
  @IsBoolean()
  permite!: boolean;
}

export class OrdenDestacadasDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  ids!: string[];
}

export class VisitaDto {
  @IsString()
  @MaxLength(64)
  visitante!: string;
}

export class ActualizarModuloDto {
  @IsBoolean()
  activo!: boolean;
}
