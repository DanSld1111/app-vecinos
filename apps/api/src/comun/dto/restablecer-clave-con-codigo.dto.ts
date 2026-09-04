import { IsEmail, IsString, Matches } from "class-validator";
import { REGEX_CONTRASENA_SEGURA, MENSAJE_CONTRASENA_SEGURA } from "../contrasena-segura";

export class RestablecerClaveConCodigoDto {
  @IsEmail()
  correo!: string;

  @IsString()
  codigo!: string;

  @Matches(REGEX_CONTRASENA_SEGURA, { message: MENSAJE_CONTRASENA_SEGURA })
  nuevaContrasena!: string;
}
