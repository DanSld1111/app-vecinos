import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class CrearResenaDto {
  @IsString()
  negocioId!: string;

  @IsIn([1, 2, 3, 4, 5])
  calificacion!: 1 | 2 | 3 | 4 | 5;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}
