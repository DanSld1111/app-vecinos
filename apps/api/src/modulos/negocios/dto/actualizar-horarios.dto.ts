import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString, ValidateNested } from "class-validator";

class HorarioDiaDto {
  @IsBoolean()
  cerrado!: boolean;

  @IsOptional()
  @IsString()
  abre?: string;

  @IsOptional()
  @IsString()
  cierra?: string;
}

export class ActualizarHorariosDto {
  @ValidateNested()
  @Type(() => HorarioDiaDto)
  lunes!: HorarioDiaDto;

  @ValidateNested()
  @Type(() => HorarioDiaDto)
  martes!: HorarioDiaDto;

  @ValidateNested()
  @Type(() => HorarioDiaDto)
  miercoles!: HorarioDiaDto;

  @ValidateNested()
  @Type(() => HorarioDiaDto)
  jueves!: HorarioDiaDto;

  @ValidateNested()
  @Type(() => HorarioDiaDto)
  viernes!: HorarioDiaDto;

  @ValidateNested()
  @Type(() => HorarioDiaDto)
  sabado!: HorarioDiaDto;

  @ValidateNested()
  @Type(() => HorarioDiaDto)
  domingo!: HorarioDiaDto;
}
