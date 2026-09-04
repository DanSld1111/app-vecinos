import { IsEmail, IsString } from "class-validator";

export class IniciarSesionVecinoDto {
  @IsEmail()
  correo!: string;

  @IsString()
  contrasena!: string;
}
