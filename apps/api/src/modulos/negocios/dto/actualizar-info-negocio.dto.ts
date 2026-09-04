import { IsArray, IsOptional, IsString } from "class-validator";

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
}
