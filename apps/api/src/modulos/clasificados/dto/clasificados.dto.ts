import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export const SECCIONES = ["inmuebles", "mascotas", "turismo"];
export const SUBTIPOS = ["alquiler", "venta", "perdido", "encontrado", "adopcion", "full_day", "varios_dias", "playa", "aventura"];
export const CIERRES = ["alquilado", "vendido", "encontrado", "adoptado", "otro"];

/** App: lo que envía el vecino. Queda «pendiente» hasta que el equipo lo revise. */
export class EnviarClasificadoDto {
  @IsIn(SECCIONES) seccion!: string;
  @IsIn(SUBTIPOS) subtipo!: string;
  @IsString() @MaxLength(3000) texto!: string;
  @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) fotos!: string[];
  @IsString() @MaxLength(20) whatsapp!: string;
  @IsBoolean() autorizaContacto!: boolean;
  /** Lo que el vecino quiso marcar (tipo de inmueble, especie…). El equipo lo revisa igual. */
  @IsOptional() @IsObject() datos?: Record<string, unknown>;
}

/** Panel: cargar un aviso a mano, o editar uno antes o después de publicarlo. */
export class GuardarClasificadoDto {
  @IsIn(SECCIONES) seccion!: string;
  @IsIn(SUBTIPOS) subtipo!: string;
  @IsString() @MaxLength(140) titulo!: string;
  @IsString() @MaxLength(3000) texto!: string;
  @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) fotos!: string[];
  @IsString() @MaxLength(200) referencia!: string;
  @IsObject() datos!: Record<string, unknown>;
  @IsString() @MaxLength(80) contactoNombre!: string;
  @IsString() @MaxLength(40) contactoRol!: string;
  @IsString() @MaxLength(20) contactoWhatsapp!: string;
  @IsString() @MaxLength(20) contactoTelefono!: string;
  /** Solo al cargar a mano: la comunidad donde se publica. */
  @IsOptional() @IsString() comunidadId?: string;
}

export class RechazarClasificadoDto {
  @IsString() @MaxLength(300) motivo!: string;
}

export class CerrarClasificadoDto {
  @IsIn(CIERRES) cierre!: string;
}

export class ReportarClasificadoDto {
  @IsOptional() @IsString() @MaxLength(300) motivo?: string;
}
