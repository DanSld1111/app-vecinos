import { IsOptional, IsString, Length, MinLength } from "class-validator";

export class CrearComunidadDto {
  @IsString()
  @MinLength(1)
  distritoUbigeo!: string;

  @IsString()
  @Length(1, 80)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
