import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";

/** Las fichas que la app sabe dibujar — igual que TIPOS_FICHA en paquetes/tipos/src/ficha.ts
 * (la API solo importa tipos de ese paquete, no valores). */
export const TIPOS_FICHA = ["menu", "catalogo", "servicios", "rubros", "ofertas", "galeria"] as const;

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
}
