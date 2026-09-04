import { IsString, MinLength } from "class-validator";

export class RechazarNegocioDto {
  @IsString()
  @MinLength(1)
  motivo!: string;
}
