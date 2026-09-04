import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { Cuenta } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { generarCodigoRecuperacion, codigoVencido, logCodigoDesarrollo } from "../../comun/codigo-recuperacion";
import { SELECT_CUENTA, FilaCuentaConHash, aCuenta } from "../cuentas/cuentas.mapeo";

interface FilaRecuperacion {
  id: string;
  codigo_recuperacion_hash: string | null;
  codigo_recuperacion_expira: string | null;
}

export interface SesionIniciada {
  token: string;
  cuenta: Cuenta;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly jwt: JwtService,
  ) {}

  private async buscarPorCorreo(correo: string): Promise<FilaCuentaConHash | null> {
    const { rows } = await this.bd.consultar<FilaCuentaConHash>(
      `${SELECT_CUENTA} WHERE lower(c.correo) = lower($1) AND c.eliminado_en IS NULL GROUP BY c.id`,
      [correo.trim()],
    );
    return rows[0] ?? null;
  }

  async validarCredenciales(correo: string, contrasena: string): Promise<Cuenta | null> {
    const fila = await this.buscarPorCorreo(correo);
    if (!fila || !fila.activo) return null;
    const coincide = await bcrypt.compare(contrasena, fila.password_hash);
    return coincide ? aCuenta(fila) : null;
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<SesionIniciada> {
    const cuenta = await this.validarCredenciales(correo, contrasena);
    if (!cuenta) throw new UnauthorizedException("Correo o contraseña incorrectos.");

    await this.bd.consultar("UPDATE cuentas SET ultimo_acceso_en = now() WHERE id = $1", [cuenta.id]);

    const token = await this.jwt.signAsync({ sub: cuenta.id });
    return { token, cuenta: { ...cuenta, ultimoAccesoEn: new Date().toISOString() } };
  }

  /**
   * Se vuelve a consultar la base en cada request (no se confía solo en el payload del
   * token): si a alguien lo desactivan o le cambian el rol a mitad de sesión, pierde el
   * acceso de inmediato en la siguiente llamada, sin esperar a que el token expire.
   */
  async obtenerCuentaVigente(id: string): Promise<Cuenta | null> {
    const { rows } = await this.bd.consultar<FilaCuentaConHash>(
      `${SELECT_CUENTA} WHERE c.id = $1 AND c.eliminado_en IS NULL GROUP BY c.id`,
      [id],
    );
    const fila = rows[0];
    return fila && fila.activo ? aCuenta(fila) : null;
  }

  /**
   * Siempre responde igual exista o no el correo — evitar que "olvidé mi clave" sirva para
   * confirmar qué correos tienen cuenta en el sistema.
   */
  async solicitarRecuperacion(correo: string): Promise<void> {
    const fila = await this.buscarPorCorreo(correo);
    if (!fila || !fila.activo) return;

    const { codigo, hash, expira } = await generarCodigoRecuperacion();
    await this.bd.consultar(
      "UPDATE cuentas SET codigo_recuperacion_hash = $2, codigo_recuperacion_expira = $3 WHERE id = $1",
      [fila.id, hash, expira],
    );
    logCodigoDesarrollo(fila.correo, codigo);
  }

  async restablecerConCodigo(correo: string, codigo: string, nuevaContrasena: string): Promise<void> {
    const { rows } = await this.bd.consultar<FilaRecuperacion>(
      "SELECT id, codigo_recuperacion_hash, codigo_recuperacion_expira FROM cuentas WHERE lower(correo) = lower($1) AND eliminado_en IS NULL",
      [correo.trim()],
    );
    const fila = rows[0];
    if (!fila?.codigo_recuperacion_hash || codigoVencido(fila.codigo_recuperacion_expira)) {
      throw new BadRequestException("El código no es válido o ya venció. Solicita uno nuevo.");
    }
    const coincide = await bcrypt.compare(codigo, fila.codigo_recuperacion_hash);
    if (!coincide) throw new BadRequestException("El código no es válido o ya venció. Solicita uno nuevo.");

    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await this.bd.consultar(
      `UPDATE cuentas
       SET password_hash = $2, codigo_recuperacion_hash = NULL, codigo_recuperacion_expira = NULL
       WHERE id = $1`,
      [fila.id, hash],
    );
  }
}
