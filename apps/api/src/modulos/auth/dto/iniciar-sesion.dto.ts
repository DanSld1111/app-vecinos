import { IsEmail, IsString } from "class-validator";

export class IniciarSesionDto {
  @IsEmail()
  correo!: string;

  @IsString()
  contrasena!: string;
}
