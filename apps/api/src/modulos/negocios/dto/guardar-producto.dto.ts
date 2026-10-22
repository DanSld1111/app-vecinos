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

/** Una fecha de salida de un tour (decisión 0096). */
export class SalidaTourDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha!: string;

  @Matches(/^\d{1,2}:\d{2}$/)
  hora!: string;

  /** null = sin límite. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  cupos?: number | null;
}

export class PasoItinerarioDto {
  @IsString()
  @MaxLength(10)
  hora!: string;

  @IsString()
  @MaxLength(80)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  detalle?: string;
}

/** Lo que usa la ficha Tours; las demás fichas lo dejan vacío. */
export class DetalleProductoDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => SalidaTourDto)
  salidas?: SalidaTourDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => PasoItinerarioDto)
  itinerario?: PasoItinerarioDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  incluye?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  noIncluye?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  puntoEncuentro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  cancelacion?: string;
}

/** Mismos campos al crear y al editar — el id va en la ruta, no en el cuerpo. */
export class GuardarProductoDto {
  @IsString()
  @MaxLength(120)
  nombre!: string;

  @IsString()
  @MaxLength(400)
  descripcion!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio!: number;

  /** Sección del menú, texto libre: cada negocio usa las suyas ("Parrillas", "Panes"). */
  @IsString()
  @MaxLength(60)
  categoriaMenu!: string;

  @IsOptional()
  @IsBoolean()
  destacado?: boolean;

  /** Campos según la categoría del negocio (ej. talla/color en Moda) — clave del
   * AtributoProductoDef → valor. Vacío u omitido si la categoría no define ninguno. */
  @IsOptional()
  @IsObject()
  atributos?: Record<string, string>;

  /** null u omitido = la moneda del negocio. */
  @IsOptional()
  @IsIn(["PEN", "USD", "EUR"])
  moneda?: "PEN" | "USD" | "EUR" | null;

  /** Fotos extra (además de la portada), ya subidas con POST /negocios/:id/productos/fotos. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  @IsString({ each: true })
  @MaxLength(600, { each: true })
  fotos?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DetalleProductoDto)
  detalle?: DetalleProductoDto;
}
