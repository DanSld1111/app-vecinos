import { randomUUID } from "crypto";
import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { Cuenta, ResultadoPaginado, RolCuenta } from "@app-vecinos/tipos";
import { BaseDatosService, Consultable } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { codificarCursor, decodificarCursor } from "../../comun/paginacion";
import { SELECT_CUENTA, FilaCuenta, FilaCuentaConHash, aCuenta } from "./cuentas.mapeo";
import { CrearCuentaDto } from "./dto/crear-cuenta.dto";
import { ActualizarCuentaDto } from "./dto/actualizar-cuenta.dto";
import { ActualizarPerfilDto } from "./dto/actualizar-perfil.dto";
import { CARPETA_FOTOS_CUENTA } from "./foto-cuenta.config";

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
    private readonly almacenamiento: AlmacenamientoService,
  ) {}

  /**
   * Antes traía todo sin límite (ver docs/decisiones/0021-endurecimiento-post-diagnostico.md).
   * Orden cambiado de alfabético a "más nueva primero" — es lo que necesita la paginación por
   * keyset (creado_en, id), y de paso es más útil en un panel admin ("¿qué cuenta se creó
   * últimoo?") que el alfabético que tenía antes.
   */
  /**
   * `soloRol`: gestor_negocios solo llega a este listado para elegir a quién vincular un
   * negocio — el controller fuerza `soloRol = "dueno_negocio"` para ese rol, nunca lo decide
   * el cliente, así nunca ve validadores, otros gestores ni cuentas de super_admin.
   */
  async listar(cursor: string | undefined, limite: number, soloRol?: RolCuenta): Promise<ResultadoPaginado<Cuenta>> {
    const condiciones = ["c.eliminado_en IS NULL"];
    const valores: unknown[] = [];

    if (soloRol) {
      valores.push(soloRol);
      condiciones.push(`c.rol = $${valores.length}`);
    }

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

  /**
   * `creadorRol`: gestor_negocios solo puede crear cuentas "dueño de negocio" — es lo único
   * para lo que se le abrió este endpoint (ver docs/decisiones/0071). super_admin no tiene
   * esta restricción. El controller es quien decide si puede llamar al endpoint; esto es la
   * segunda capa, la que evita que arme una cuenta de otro rol a mano contra la API.
   */
  async crear(dto: CrearCuentaDto, creadaPorCuentaId: string, creadorRol?: RolCuenta): Promise<Cuenta> {
    if (creadorRol === "gestor_negocios" && dto.rol !== "dueno_negocio") {
      throw new ForbiddenException("Como gestor de negocios, solo puedes crear cuentas de dueño de negocio.");
    }
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
   * Vincular/desvincular un negocio a una cuenta "dueño de negocio" — a propósito mucho más
   * angosto que `actualizar()` (que puede cambiar nombre, correo y rol de cualquier cuenta):
   * esta es la única puerta que se le abrió a gestor_negocios, y por diseño no puede tocar
   * nada más de la cuenta. Ver docs/decisiones/0071.
   */
  async vincularNegocio(cuentaId: string, negocioId: string, actorId: string): Promise<Cuenta> {
    const cuenta = await this.obtenerFilaDuenoOFallar(cuentaId);
    await this.bd.consultar(
      "INSERT INTO cuenta_negocios (cuenta_id, negocio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [cuentaId, negocioId],
    );
    await this.auditoria.registrar("vincular-negocio", "cuenta", cuentaId, actorId, { negocioId });
    return (await this.obtenerPorId(cuentaId)) ?? cuenta;
  }

  async desvincularNegocio(cuentaId: string, negocioId: string, actorId: string): Promise<Cuenta> {
    const cuenta = await this.obtenerFilaDuenoOFallar(cuentaId);
    await this.bd.consultar("DELETE FROM cuenta_negocios WHERE cuenta_id = $1 AND negocio_id = $2", [
      cuentaId,
      negocioId,
    ]);
    await this.auditoria.registrar("desvincular-negocio", "cuenta", cuentaId, actorId, { negocioId });
    return (await this.obtenerPorId(cuentaId)) ?? cuenta;
  }

  private async obtenerFilaDuenoOFallar(cuentaId: string): Promise<Cuenta> {
    const cuenta = await this.obtenerPorId(cuentaId);
    if (!cuenta) throw new NotFoundException(`No existe una cuenta con id "${cuentaId}"`);
    if (cuenta.rol !== "dueno_negocio") {
      throw new ForbiddenException("Solo se puede vincular un negocio a una cuenta con rol \"dueño de negocio\".");
    }
    return cuenta;
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

  /** Igual que NegociosService.actualizarFoto: borra el archivo anterior de Supabase Storage al reemplazarlo. */
  async actualizarFotoPropia(id: string, archivo: Express.Multer.File): Promise<Cuenta> {
    const anterior = (await this.obtenerPorId(id))?.fotoUrl;
    if (anterior === undefined) throw new NotFoundException(`No existe una cuenta con id "${id}"`);

    const url = await this.almacenamiento.subir(CARPETA_FOTOS_CUENTA, archivo.buffer, archivo.originalname, archivo.mimetype);
    await this.bd.consultar("UPDATE cuentas SET foto_url = $2 WHERE id = $1", [id, url]);
    await this.almacenamiento.eliminarPorUrl(anterior);

    return (await this.obtenerPorId(id))!;
  }
}
