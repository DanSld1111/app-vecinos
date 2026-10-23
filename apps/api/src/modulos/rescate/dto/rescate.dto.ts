import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

const ESPECIES = ["perro", "gato", "otro"];
const TAMANOS = ["pequeno", "mediano", "grande"];
const CONVIVE = ["si", "no", "nose"];

export class SaludDto {
  @IsOptional() @IsBoolean() vacunas?: boolean;
  @IsOptional() @IsBoolean() esterilizado?: boolean;
  @IsOptional() @IsBoolean() desparasitado?: boolean;
  @IsOptional() @IsBoolean() microchip?: boolean;
  @IsOptional() @IsBoolean() cuidadosEspeciales?: boolean;
}

export class ConvivenciaDto {
  @IsOptional() @IsIn(CONVIVE) ninos?: string;
  @IsOptional() @IsIn(CONVIVE) perros?: string;
  @IsOptional() @IsIn(CONVIVE) gatos?: string;
}

/** Panel: crear o editar una mascota del albergue. */
export class GuardarMascotaDto {
  @IsString() @MaxLength(40) nombre!: string;
  @IsIn(ESPECIES) especie!: string;
  @IsIn(["hembra", "macho"]) sexo!: string;
  @IsOptional() @IsInt() @Min(0) @Max(40) edadValor?: number | null;
  @IsOptional() @IsIn(["anios", "meses"]) edadUnidad?: string;
  @IsIn(TAMANOS) tamano!: string;
  @IsOptional() @IsNumber() @Min(0) @Max(150) pesoKg?: number | null;
  @IsOptional() @IsString() @MaxLength(500) fotoUrl?: string | null;
  @IsOptional() @IsArray() @ArrayMaxSize(9) @IsString({ each: true }) @MaxLength(500, { each: true }) fotos?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(40, { each: true }) personalidad?: string[];
  @IsOptional() @ValidateNested() @Type(() => SaludDto) salud?: SaludDto;
  @IsOptional() @ValidateNested() @Type(() => ConvivenciaDto) convivencia?: ConvivenciaDto;
  @IsOptional() @IsString() @MaxLength(1500) historia?: string;
  @IsOptional() @IsIn(["disponible", "en_proceso", "adoptada"]) estado?: string;
  @IsOptional() @IsBoolean() urgente?: boolean;
  @IsOptional() @IsBoolean() apadrinable?: boolean;
}

export class NecesidadDto {
  @IsString() @MaxLength(60) que!: string;
  @IsNumber() @Min(0) @Max(100000) tiene!: number;
  @IsNumber() @Min(1) @Max(100000) meta!: number;
  @IsString() @MaxLength(20) unidad!: string;
}

export class TurnoDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) fecha!: string;
  @Matches(/^\d{1,2}:\d{2}$/) hora!: string;
  @IsString() @MaxLength(80) que!: string;
  @IsInt() @Min(0) @Max(500) faltan!: number;
}

/** Panel: cómo ayudar al albergue. */
export class DatosAlbergueDto {
  @IsOptional() @IsString() @MaxLength(20) yape?: string;
  @IsOptional() @IsString() @MaxLength(80) titular?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(4) @IsInt({ each: true }) @Min(1, { each: true }) @Max(5000, { each: true }) montosPadrinazgo?: number[];
  @IsOptional() @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => NecesidadDto) necesidades?: NecesidadDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => TurnoDto) turnos?: TurnoDto[];
  @IsOptional() @IsString() @MaxLength(600) requisitos?: string;
}

export class OrdenMascotasDto {
  @IsArray() @ArrayMaxSize(300) @IsString({ each: true }) ids!: string[];
}

/** App: el vecino pide adoptar. */
export class SolicitarAdopcionDto {
  @IsObject() respuestas!: Record<string, string>;
  @IsOptional() @IsString() @MaxLength(800) motivo?: string;
}

export class ApadrinarDto {
  @IsNumber() @Min(1) @Max(5000) monto!: number;
}

export class EstadoSolicitudDto {
  @IsIn(["nueva", "entrevista", "aprobada", "adoptada", "no_aprobada"]) estado!: string;
}

export class EstadoPadrinazgoDto {
  /** "confirmar" = llegó el pago del mes. */
  @IsIn(["confirmar", "cancelar"]) accion!: string;
}

/** App: publicar un aviso de mascota perdida o encontrada. */
export class CrearAvisoDto {
  @IsIn(["perdido", "encontrado"]) tipo!: string;
  @IsIn(ESPECIES) especie!: string;
  @IsOptional() @IsString() @MaxLength(40) nombre?: string;
  @IsString() @MaxLength(500) senas!: string;
  @IsOptional() @IsIn(TAMANOS) tamano?: string;
  @IsOptional() @IsString() @MaxLength(60) recompensa?: string;
  @IsArray() @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(500, { each: true }) fotos!: string[];
  @IsString() @MaxLength(160) lugar!: string;
  @IsOptional() @IsNumber() lat?: number | null;
  @IsOptional() @IsNumber() lng?: number | null;
  @IsOptional() @IsString() @MaxLength(60) cuando?: string;
  @IsBoolean() mostrarWhatsapp!: boolean;
}

export class PistaDto {
  @IsOptional() @IsString() @MaxLength(60) cuando?: string;
  @IsOptional() @IsString() @MaxLength(160) lugar?: string;
  @IsOptional() @IsNumber() lat?: number | null;
  @IsOptional() @IsNumber() lng?: number | null;
  @IsString() @MaxLength(500) texto!: string;
  @IsOptional() @IsString() @MaxLength(500) fotoUrl?: string | null;
  @IsOptional() @IsBoolean() esMio?: boolean;
}

export class ReportarAvisoDto {
  @IsOptional() @IsString() @MaxLength(120) motivo?: string;
}

export class ModerarAvisoDto {
  @IsIn(["publicado", "oculto"]) estado!: string;
}
