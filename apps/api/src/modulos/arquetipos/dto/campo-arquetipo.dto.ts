import { IsBoolean, IsString, MinLength } from "class-validator";

export class CampoArquetipoDto {
  @IsString()
  @MinLength(1)
  claveOriginal!: string;

  @IsString()
  @MinLength(1)
  etiqueta!: string;

  @IsBoolean()
  obligatorio!: boolean;
}
