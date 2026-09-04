import { IsString, Length } from "class-validator";

/** Autoservicio: lo único que cualquier cuenta puede cambiar de sí misma además de la
 * contraseña y la foto. El correo NO está acá a propósito — es el identificador de login,
 * cambiarlo es cosa de un super_admin desde Cuentas (PUT /cuentas/:id). */
export class ActualizarPerfilDto {
  @IsString()
  @Length(1, 120)
  nombre!: string;
}
