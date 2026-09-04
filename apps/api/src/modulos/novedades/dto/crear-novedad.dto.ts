import { IsString, MinLength } from "class-validator";

export class CrearNovedadDto {
  @IsString()
  @MinLength(1)
  titulo!: string;

  @IsString()
  @MinLength(1)
  texto!: string;
}
