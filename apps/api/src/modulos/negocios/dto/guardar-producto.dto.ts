import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

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
}
