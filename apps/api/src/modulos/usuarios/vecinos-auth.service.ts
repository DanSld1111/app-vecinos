import { randomUUID } from "crypto";
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsuarioApp } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { generarCodigoRecuperacion, codigoVencido, logCodigoDesarrollo } from "../../comun/codigo-recuperacion";
import { SELECT_USUARIO_APP, FilaUsuarioAppConHash, aUsuarioApp } from "./usuarios.mapeo";
import { RegistrarVecinoDto } from "./dto/registrar-vecino.dto";

const RONDAS_BCRYPT = 10;

interface FilaRecuperacionVecino {
  id: string;
  correo: string;
  codigo_recuperacion_hash: string | null;
  codigo_recuperacion_expira: string | null;
}

export interface SesionVecino {
  token: string;
  usuario: UsuarioApp;
}

function esViolacionDeUnicidad(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
}

@Injectable()
export class VecinosAuthService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly jwt: JwtService,
  ) {}

  private firmar(usuarioId: string): Promise<string> {
    return this.jwt.signAsync({ sub: usuarioId });
  }

  async registrar(dto: RegistrarVecinoDto): Promise<SesionVecino> {
    const id = `usr-${randomUUID()}`;
    const hash = await bcrypt.hash(dto.contrasena, RONDAS_BCRYPT);

    try {
      await this.bd.consultar(
        `INSERT INTO usuarios_app (id, nombre, apellido, correo, password_hash, telefono, comunidad_id, estado, registrado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo', now())`,
        [id, dto.nombre.trim(), dto.apellido.trim(), dto.correo.trim().toLowerCase(), hash, dto.telefono, dto.comunidadId],
      );
    } catch (error) {
      if (esViolacionDeUnicidad(error)) {
        throw new ConflictException("Ese correo o número de celular ya está registrado.");
      }
      throw error;
    }

    const { rows } = await this.bd.consultar<FilaUsuarioAppConHash>(`${SELECT_USUARIO_APP} WHERE id = $1`, [id]);
    return { token: await this.firmar(id), usuario: aUsuarioApp(rows[0]) };
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<SesionVecino> {
    const { rows } = await this.bd.consultar<FilaUsuarioAppConHash>(
      `SELECT id, nombre, apellido, correo, telefono, comunidad_id, estado, registrado_en, ultimo_acceso_en, password_hash
       FROM usuarios_app
       WHERE lower(correo) = lower($1) AND eliminado_en IS NULL`,
      [correo.trim()],
    );
    const fila = rows[0];
    if (!fila || fila.estado !== "activo") throw new UnauthorizedException("Correo o contraseña incorrectos.");

    const coincide = await bcrypt.compare(contrasena, fila.password_hash);
    if (!coincide) throw new UnauthorizedException("Correo o contraseña incorrectos.");

    await this.bd.consultar("UPDATE usuarios_app SET ultimo_acceso_en = now() WHERE id = $1", [fila.id]);
    return { token: await this.firmar(fila.id), usuario: { ...aUsuarioApp(fila), ultimoAccesoEn: new Date().toISOString() } };
  }

  async obtenerVigente(id: string): Promise<UsuarioApp | null> {
    const { rows } = await this.bd.consultar<FilaUsuarioAppConHash>(
      `${SELECT_USUARIO_APP} WHERE id = $1 AND eliminado_en IS NULL`,
      [id],
    );
    const fila = rows[0];
    return fila && fila.estado === "activo" ? aUsuarioApp(fila) : null;
  }

  async solicitarRecuperacion(correo: string): Promise<void> {
    const { rows } = await this.bd.consultar<{ id: string; correo: string; estado: UsuarioApp["estado"] }>(
      "SELECT id, correo, estado FROM usuarios_app WHERE lower(correo) = lower($1) AND eliminado_en IS NULL",
      [correo.trim()],
    );
    const fila = rows[0];
    if (!fila || fila.estado !== "activo") return;

    const { codigo, hash, expira } = await generarCodigoRecuperacion();
    await this.bd.consultar(
      "UPDATE usuarios_app SET codigo_recuperacion_hash = $2, codigo_recuperacion_expira = $3 WHERE id = $1",
      [fila.id, hash, expira],
    );
    logCodigoDesarrollo(fila.correo, codigo);
  }

  async restablecerConCodigo(correo: string, codigo: string, nuevaContrasena: string): Promise<void> {
    const { rows } = await this.bd.consultar<FilaRecuperacionVecino>(
      "SELECT id, correo, codigo_recuperacion_hash, codigo_recuperacion_expira FROM usuarios_app WHERE lower(correo) = lower($1) AND eliminado_en IS NULL",
      [correo.trim()],
    );
    const fila = rows[0];
    if (!fila?.codigo_recuperacion_hash || codigoVencido(fila.codigo_recuperacion_expira)) {
      throw new BadRequestException("El código no es válido o ya venció. Solicita uno nuevo.");
    }
    const coincide = await bcrypt.compare(codigo, fila.codigo_recuperacion_hash);
    if (!coincide) throw new BadRequestException("El código no es válido o ya venció. Solicita uno nuevo.");

    const hash = await bcrypt.hash(nuevaContrasena, RONDAS_BCRYPT);
    await this.bd.consultar(
      `UPDATE usuarios_app
       SET password_hash = $2, codigo_recuperacion_hash = NULL, codigo_recuperacion_expira = NULL
       WHERE id = $1`,
      [fila.id, hash],
    );
  }
}
