import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf, ValidateNested } from "class-validator";

/** Las fichas que la app sabe dibujar — igual que TIPOS_FICHA en paquetes/tipos/src/ficha.ts
 * (la API solo importa tipos de ese paquete, no valores). */
export const TIPOS_FICHA = ["menu", "catalogo", "servicios", "rubros", "ofertas", "galeria"] as const;

/** Texto detrás del precio cuando el producto tiene cierta opción (ej. Alquiler → "/mes"). */
export class SufijoPrecioDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  opcion!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(12)
  sufijo!: string;
}

/** Un campo extra de los productos de una categoría (ej. "Talla" en Moda). */
export class CampoProductoDto {
  /** Sin clave (o vacía) = campo nuevo; la API la genera a partir de la etiqueta. */
  @ValidateIf((o: CampoProductoDto) => Boolean(o.clave))
  @IsString()
  @Matches(/^[a-z0-9_]{1,40}$/)
  clave?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  etiqueta!: string;

  @IsIn(["opciones", "texto", "color"])
  tipo!: "opciones" | "texto" | "color";

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  opciones?: string[];

  @IsOptional()
  @IsBoolean()
  oculto?: boolean;

  /** Solo "opciones": la ficha ofrece filtrar los productos por este campo (ej. Especie). */
  @IsOptional()
  @IsBoolean()
  filtro?: boolean;

  /** Solo "opciones" con un "Sí": los productos que lo tienen muestran la etiqueta como insignia (ej. "Receta"). */
  @IsOptional()
  @IsBoolean()
  insignia?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SufijoPrecioDto)
  sufijoPrecio?: SufijoPrecioDto;
}

/** Aviso fijo en la ficha de los negocios de una categoría (ej. venta solo a mayores de 18). */
export class AvisoFichaDto {
  @IsIn(["mayores18", "receta", "info"])
  tipo!: "mayores18" | "receta" | "info";

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  texto!: string;
}
