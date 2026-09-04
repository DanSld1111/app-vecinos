import { randomUUID } from "crypto";
import { join } from "path";
import { unlink } from "fs/promises";
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { Cuenta, ResultadoPaginado } from "@app-vecinos/tipos";
import { BaseDatosService, Consultable } from "../../comun/base-datos/base-datos.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { codificarCursor, decodificarCursor } from "../../comun/paginacion";
import { SELECT_CUENTA, FilaCuenta, FilaCuentaConHash, aCuenta } from "./cuentas.mapeo";
import { CrearCuentaDto } from "./dto/crear-cuenta.dto";
import { ActualizarCuentaDto } from "./dto/actualizar-cuenta.dto";
import { ActualizarPerfilDto } from "./dto/actualizar-perfil.dto";
import { DIRECTORIO_FOTOS_CUENTA } from "./foto-cuenta.config";

const RONDAS_BCRYPT = 10;

async function reemplazarDistritosYNegocios(
  db: Consultable,
  cuentaId: string,
  negocioIds: string[],
  distritosAsignados: string[],
) {
  await db.consultar("DELETE FROM cuenta_negocios WHERE cuenta_id = $1", [cuentaId]);
  await db.consultar("DELETE FROM cuenta_distritos WHERE cuenta_id = $1", [cuentaId]);
  for (const negocioId of negocioIds) {
    await db.consultar("INSERT INTO cuenta_negocios (cuenta_id, negocio_id) VALUES ($1, $2)", [cuentaId, negocioId]);
  }
  for (const distritoUbigeo of distritosAsignados) {
    await db.consultar("INSERT INTO cuenta_distritos (cuenta_id, distrito_ubigeo) VALUES ($1, $2)", [
      cuentaId,
      distritoUbigeo,
    ]);
  }
}

function esViolacionDeUnicidad(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
}

@Injectable()
export class CuentasService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * Antes traía todo sin límite (ver docs/decisiones/0021-endurecimiento-post-diagnostico.md).
   * Orden cambiado de alfabético a "más nueva primero" — es lo que necesita la paginación por
   * keyset (creado_en, id), y de paso es más útil en un panel admin ("¿qué cuenta se creó
   * últimoo?") que el alfabético que tenía antes.
   */
  async listar(cursor: string | undefined, limite: number): Promise<ResultadoPaginado<Cuenta>> {
    const condiciones = ["c.eliminado_en IS NULL"];
    const valores: unknown[] = [];

    const cursorDecodificado = decodificarCursor(cursor);
    if (cursorDecodificado) {
      valores.push(cursorDecodificado.creadoEn, cursorDecodificado.id);
      condiciones.push(`(c.creado_en, c.id) < ($${valores.length - 1}, $${valores.length})`);
    }
    valores.push(limite + 1);

    const { rows } = await this.bd.consultar<FilaCuenta>(
      `${SELECT_CUENTA}
       WHERE ${condiciones.join(" AND ")}
       GROUP BY c.id
       ORDER BY c.creado_en DESC, c.id DESC
       LIMIT $${valores.length}`,
      valores,
    );

    const hayMas = rows.length > limite;
    const items = rows.slice(0, limite).map(aCuenta);
    const ultima = items[items.length - 1];
    const cursorSiguiente = hayMas && ultima ? codificarCursor({ creadoEn: ultima.creadoEn, id: ultima.id }) : null;
    return { items, cursorSiguiente };
  }

  async obtenerPorId(id: string): Promise<Cuenta | null> {
    const { rows } = await this.bd.consultar<FilaCuenta>(
      `${SELECT_CUENTA} WHERE c.id = $1 AND c.eliminado_en IS NULL GROUP BY c.id`,
      [id],
    );
    return rows[0] ? aCuenta(rows[0]) : null;
  }

  async crear(dto: CrearCuentaDto, creadaPorCuentaId: string): Promise<Cuenta> {
    const id = `cuenta-${randomUUID()}`;
    const hash = await bcrypt.hash(dto.contrasena, RONDAS_BCRYPT);

    try {
      const nueva = await this.bd.transaccion(async (db) => {
        await db.consultar(
          `INSERT INTO cuentas (id, nombre, correo, rol, password_hash, activo, creado_en)
           VALUES ($1, $2, $3, $4, $5, true, now())`,
          [id, dto.nombre, dto.correo.trim().toLowerCase(), dto.rol, hash],
        );
        await reemplazarDistritosYNegocios(db, id, dto.negocioIds, dto.distritosAsignados);
        const { rows } = await db.consultar<FilaCuenta>(`${SELECT_CUENTA} WHERE c.id = $1 GROUP BY c.id`, [id]);
        return aCuenta(rows[0]);
      });
      await this.auditoria.registrar("crear", "cuenta", id, creadaPorCuentaId, { correo: nueva.correo, rol: nueva.rol });
      return nueva;
    } catch (error) {
      if (esViolacionDeUnicidad(error)) {
        throw new ConflictException(`Ya existe una cuenta con el correo "${dto.correo}"`);
      }
      throw error;
    }
  }

  async actualizar(id: string, dto: ActualizarCuentaDto): Promise<Cuenta> {
    try {
      return await this.bd.transaccion(async (db) => {
        const { rowCount } = await db.consultar(
          `UPDATE cuentas SET nombre = $2, correo = $3, rol = $4 WHERE id = $1`,
          [id, dto.nombre, dto.correo.trim().toLowerCase(), dto.rol],
        );
        if (!rowCount) throw new NotFoundException(`No existe una cuenta con id "${id}"`);

        await reemplazarDistritosYNegocios(db, id, dto.negocioIds, dto.distritosAsignados);
        const { rows } = await db.consultar<FilaCuenta>(`${SELECT_CUENTA} WHERE c.id = $1 GROUP BY c.id`, [id]);
        return aCuenta(rows[0]);
      });
    } catch (error) {
      if (esViolacionDeUnicidad(error)) {
        throw new ConflictException(`Ya existe una cuenta con el correo "${dto.correo}"`);
      }
      throw error;
    }
  }

  /**
   * Baja lógica, no DELETE físico: se marca `eliminado_en` y la cuenta deja de aparecer en
   * cualquier listado o login, pero el registro queda por si hace falta revertir o auditar
   * (ver docs/decisiones/0021-endurecimiento-post-diagnostico.md). `eliminado_en IS NULL` en
   * el WHERE evita "re-eliminar" (y volver a auditar) una cuenta ya eliminada.
   */
  async eliminar(id: string, eliminadaPorCuentaId: string): Promise<void> {
    const { rowCount } = await this.bd.consultar(
      "UPDATE cuentas SET eliminado_en = now() WHERE id = $1 AND eliminado_en IS NULL",
      [id],
    );
    if (!rowCount) throw new NotFoundException(`No existe una cuenta con id "${id}"`);
    await this.auditoria.registrar("eliminar", "cuenta", id, eliminadaPorCuentaId);
  }

  async alternarActivo(id: string, cuentaQueActua: string): Promise<Cuenta> {
    const { rowCount } = await this.bd.consultar(
      "UPDATE cuentas SET activo = NOT activo WHERE id = $1 AND eliminado_en IS NULL",
      [id],
    );
    if (!rowCount) throw new NotFoundException(`No existe una cuenta con id "${id}"`);
    const cuenta = (await this.obtenerPorId(id))!;
    await this.auditoria.registrar("alternar-activo", "cuenta", id, cuentaQueActua, { activo: cuenta.activo });
    return cuenta;
  }

  async restablecerClave(id: string, nuevaContrasena: string, cuentaQueActua: string): Promise<void> {
    const hash = await bcrypt.hash(nuevaContrasena, RONDAS_BCRYPT);
    const { rowCount } = await this.bd.consultar(
      "UPDATE cuentas SET password_hash = $2 WHERE id = $1 AND eliminado_en IS NULL",
      [id, hash],
    );
    if (!rowCount) throw new NotFoundException(`No existe una cuenta con id "${id}"`);
    await this.auditoria.registrar("restablecer-clave", "cuenta", id, cuentaQueActua);
  }

  /** Autoservicio "Mi cuenta" — cualquier rol puede llamar estos cuatro sobre sí mismo. */
  async actualizarPerfilPropio(id: string, dto: ActualizarPerfilDto): Promise<Cuenta> {
    const { rowCount } = await this.bd.consultar("UPDATE cuentas SET nombre = $2 WHERE id = $1 AND eliminado_en IS NULL", [
      id,
      dto.nombre,
    ]);
    if (!rowCount) throw new NotFoundException(`No existe una cuenta con id "${id}"`);
    return (await this.obtenerPorId(id))!;
  }

  /** A diferencia de restablecerClave() (un super_admin sobre otra cuenta), acá se exige la
   * contraseña actual — quien cambia su propia clave debe demostrar que la conoce. */
  async cambiarClavePropia(id: string, claveActual: string, claveNueva: string): Promise<void> {
    const { rows } = await this.bd.consultar<FilaCuentaConHash>(
      "SELECT password_hash FROM cuentas WHERE id = $1 AND eliminado_en IS NULL",
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`No existe una cuenta con id "${id}"`);

    const coincide = await bcrypt.compare(claveActual, rows[0].password_hash);
    if (!coincide) throw new UnauthorizedException("Tu contraseña actual no es correcta.");

    const hash = await bcrypt.hash(claveNueva, RONDAS_BCRYPT);
    await this.bd.consultar("UPDATE cuentas SET password_hash = $2 WHERE id = $1", [id, hash]);
    await this.auditoria.registrar("cambiar-clave-propia", "cuenta", id, id);
  }

  /** Igual que NegociosService.actualizarFoto: borra el archivo anterior del disco al reemplazarlo. */
  async actualizarFotoPropia(id: string, nombreArchivo: string): Promise<Cuenta> {
    const anterior = (await this.obtenerPorId(id))?.fotoUrl;
    if (anterior === undefined) throw new NotFoundException(`No existe una cuenta con id "${id}"`);

    await this.bd.consultar("UPDATE cuentas SET foto_url = $2 WHERE id = $1", [id, `/uploads/cuentas/${nombreArchivo}`]);

    if (anterior?.startsWith("/uploads/cuentas/")) {
      await unlink(join(DIRECTORIO_FOTOS_CUENTA, anterior.replace("/uploads/cuentas/", ""))).catch(() => undefined);
    }

    return (await this.obtenerPorId(id))!;
  }
}
