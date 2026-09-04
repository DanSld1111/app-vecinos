import { ArrayMinSize, IsArray, IsString, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CampoArquetipoDto } from "./campo-arquetipo.dto";

export class CrearArquetipoDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  icono!: string;

  @IsString()
  @MinLength(1)
  plantillaId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CampoArquetipoDto)
  campos!: CampoArquetipoDto[];
}
