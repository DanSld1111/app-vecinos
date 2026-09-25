import { Type } from "class-transformer";
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from "class-validator";
import { Moneda } from "@app-vecinos/tipos";
import { CoordenadaDto } from "./coordenada.dto";

const MONEDAS: Moneda[] = ["PEN", "USD", "EUR"];

export class ActualizarInfoNegocioDto {
  @IsString()
  nombre!: string;

  @IsString()
  descripcion!: string;

  // Sin mínimo a propósito: la UI permite dejarlo momentáneamente sin categoría
  // ("Sin categoría" en el selector) mientras se termina de completar la ficha.
  @IsArray()
  @IsString({ each: true })
  categoriaIds!: string[];

  @IsString()
  direccion!: string;

  @IsOptional()
  @IsString()
  telefono?: string | null;

  @IsOptional()
  @IsString()
  whatsapp?: string | null;

  /**
   * Ubicación exacta. Opcional: si no viene, se deja la que ya tenía — al crear un negocio
   * desde el panel se le asigna el centro de la comunidad, y esto es lo que permite
   * corregirla después (antes no había forma, todos quedaban clavados en el mismo punto).
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordenadaDto)
  coordenada?: CoordenadaDto;

  @IsOptional()
  @IsIn(MONEDAS)
  moneda?: Moneda;

  /** Texto libre del dueño — se muestra en "Información del negocio". Puede llegar null para
   * borrarlo. */
  @IsOptional()
  @IsString()
  acercaDelNegocio?: string | null;
}
