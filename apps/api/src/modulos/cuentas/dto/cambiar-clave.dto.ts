import { IsString, Matches, MinLength } from "class-validator";
import { REGEX_CONTRASENA_SEGURA, MENSAJE_CONTRASENA_SEGURA } from "../../../comun/contrasena-segura";

/** Autoservicio: a diferencia de "restablecer clave" (que hace un super_admin sobre otra
 * cuenta, sin conocer la anterior), acá quien cambia su propia contraseña debe demostrar que
 * conoce la actual — mismo criterio de seguridad que cualquier "cambiar contraseña" estándar. */
export class CambiarClaveDto {
  @IsString()
  @MinLength(1)
  claveActual!: string;

  @Matches(REGEX_CONTRASENA_SEGURA, { message: MENSAJE_CONTRASENA_SEGURA })
  claveNueva!: string;
}
