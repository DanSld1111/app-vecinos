import { IsOptional, IsString } from "class-validator";

export class BuscarDistritosDto {
  @IsOptional()
  @IsString()
  q?: string;
}
