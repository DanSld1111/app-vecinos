import { RolCuenta } from "@app-vecinos/tipos";
import { IsArray, IsEmail, IsIn, IsString } from "class-validator";

const ROLES: RolCuenta[] = ["super_admin", "dueno_negocio", "junta_vecinal", "validador_contenido"];

export class ActualizarCuentaDto {
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
}
