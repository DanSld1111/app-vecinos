import { IsEmail, IsString, Matches, MinLength } from "class-validator";
import { REGEX_CONTRASENA_SEGURA, MENSAJE_CONTRASENA_SEGURA } from "../../../comun/contrasena-segura";

export class RegistrarVecinoDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  apellido!: string;

  @IsEmail()
  correo!: string;

  @IsString()
  @MinLength(6)
  telefono!: string;

  @IsString()
  comunidadId!: string;

  @Matches(REGEX_CONTRASENA_SEGURA, { message: MENSAJE_CONTRASENA_SEGURA })
  contrasena!: string;
}
