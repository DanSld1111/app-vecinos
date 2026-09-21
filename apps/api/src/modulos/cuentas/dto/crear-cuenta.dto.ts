import { RolCuenta } from "@app-vecinos/tipos";
import { IsArray, IsEmail, IsIn, IsString, MinLength } from "class-validator";

const ROLES: RolCuenta[] = [
  "super_admin",
  "dueno_negocio",
  "junta_vecinal",
  "validador_contenido",
  "gestor_negocios",
];

export class CrearCuentaDto {
  @IsString()
  nombre!: string;

  @IsEmail()
  correo!: string;

  @IsIn(ROLES)
  rol!: RolCuenta;

  @IsArray()
  @IsString({ each: true })
  negocioIds: string[] = [];

  @IsArray()
  @IsString({ each: true })
  distritosAsignados: string[] = [];

  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres." })
  contrasena!: string;
}
