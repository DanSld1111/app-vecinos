import { IsOptional, IsString, MaxLength } from "class-validator";

/** Reenviar a revisión tras un rechazo: la nota es lo que se corrigió, para el validador. */
export class ReenviarNegocioDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nota?: string;
}
