import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class ActualizarNovedadDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  texto?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
