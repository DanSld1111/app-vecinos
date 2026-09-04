import { randomUUID } from "crypto";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Aviso, Cuenta, ResultadoPaginado } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { NotificacionesPushService } from "../../comun/notificaciones-push/notificaciones-push.service";
import { codificarCursor, decodificarCursor } from "../../comun/paginacion";
import { dentroDelAlcance } from "../../comun/alcance";
import { SELECT_AVISO, FilaAviso, aAviso } from "./avisos.mapeo";
import { ListarAvisosPublicosDto } from "./dto/listar-avisos-publicos.dto";
import { CrearAvisoDirectoDto } from "./dto/crear-aviso-directo.dto";
import { EnviarAValidacionDto } from "./dto/enviar-a-validacion.dto";
import { ReenviarAvisoDto } from "./dto/reenviar-aviso.dto";

@Injectable()
export class AvisosService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly auditoria: AuditoriaService,
    private readonly notificacionesPush: NotificacionesPushService,
  ) {}

  /** Lectura pública (app del vecino): solo lo ya publicado. */
  async listarPublicados(filtro: ListarAvisosPublicosDto): Promise<ResultadoPaginado<Aviso>> {
    const condiciones = ["a.comunidad_id = $1", "a.estado = 'publicado'", "a.eliminado_en IS NULL"];
    const valores: unknown[] = [filtro.comunidadId];

    const cursor = decodificarCursor(filtro.cursor);
    if (cursor) {
      valores.push(cursor.creadoEn, cursor.id);
      condiciones.push(`(a.publicado_en, a.id) < ($${valores.length - 1}, $${valores.length})`);
    }

    const limite = filtro.limite ?? 20;
    valores.push(limite + 1);

    const { rows } = await this.bd.consultar<FilaAviso>(
      `${SELECT_AVISO} WHERE ${condiciones.join(" AND ")} ORDER BY a.publicado_en DESC, a.id DESC LIMIT $${valores.length}`,
      valores,
    );

    const hayMas = rows.length > limite;
    const items = rows.slice(0, limite).map(aAviso);
    const ultimo = items[items.length - 1];
    const cursorSiguiente = hayMas && ultimo ? codificarCursor({ creadoEn: ultimo.publicadoEn, id: ultimo.id }) : null;
    return { items, cursorSiguiente };
  }

  /** "Avisos" del super-admin: todo el contenido, sin importar quién lo creó. */
  async listarTodos(): Promise<Aviso[]> {
    const { rows } = await this.bd.consultar<FilaAviso>(
      `${SELECT_AVISO} WHERE a.eliminado_en IS NULL ORDER BY a.publicado_en DESC`,
    );
    return rows.map(aAviso);
  }

  /** "Mis avisos": lo que redactó esta cuenta (Junta Vecinal viendo su propio historial). */
  async listarPropios(cuentaId: string): Promise<Aviso[]> {
    const { rows } = await this.bd.consultar<FilaAviso>(
      `${SELECT_AVISO} WHERE a.creado_por_cuenta_id = $1 AND a.eliminado_en IS NULL ORDER BY a.publicado_en DESC`,
      [cuentaId],
    );
    return rows.map(aAviso);
  }

  /** Cola de validación: pendientes, acotados al alcance de distritos de la cuenta. */
  async listarPendientes(cuenta: Cuenta): Promise<Aviso[]> {
    const { rows } = await this.bd.consultar<FilaAviso>(
      `${SELECT_AVISO} WHERE a.estado = 'pendiente' AND a.eliminado_en IS NULL ORDER BY a.publicado_en DESC`,
    );
    return rows.filter((fila) => dentroDelAlcance(cuenta, fila.distrito_ubigeo)).map(aAviso);
  }

  /** Historial de validación: ya resueltos (publicado o rechazado), acotados al alcance de la cuenta. */
  async listarHistorial(cuenta: Cuenta): Promise<Aviso[]> {
    const { rows } = await this.bd.consultar<FilaAviso>(
      `${SELECT_AVISO} WHERE a.estado IN ('publicado', 'rechazado') AND a.eliminado_en IS NULL ORDER BY a.publicado_en DESC`,
    );
    return rows.filter((fila) => dentroDelAlcance(cuenta, fila.distrito_ubigeo)).map(aAviso);
  }

  private async obtenerFilaOFallar(id: string): Promise<FilaAviso> {
    const { rows } = await this.bd.consultar<FilaAviso>(
      `${SELECT_AVISO} WHERE a.id = $1 AND a.eliminado_en IS NULL`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un aviso con id "${id}"`);
    return rows[0];
  }

  /** Publicación directa del super-admin: no pasa por la cola. */
  async crearDirecto(dto: CrearAvisoDirectoDto, cuentaId: string): Promise<Aviso> {
    const id = `aviso-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO avisos (id, comunidad_id, fuente_nombre, fuente_verificada, titulo, cuerpo, categoria,
                            estado, creado_por_cuenta_id, validado_por_cuenta_id, publicado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'publicado', $8, $8, now())`,
      [id, dto.comunidadId, dto.fuenteNombre, dto.fuenteVerificada, dto.titulo, dto.cuerpo, dto.categoria, cuentaId],
    );
    return aAviso(await this.obtenerFilaOFallar(id));
  }

  /** Junta Vecinal redacta y envía: queda "pendiente" hasta que un validador lo revise. */
  async enviarAValidacion(dto: EnviarAValidacionDto, cuentaId: string): Promise<Aviso> {
    const id = `aviso-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO avisos (id, comunidad_id, fuente_nombre, fuente_verificada, titulo, cuerpo, categoria,
                            estado, creado_por_cuenta_id, publicado_en)
       VALUES ($1, $2, $3, false, $4, $5, $6, 'pendiente', $7, now())`,
      [id, dto.comunidadId, dto.fuenteNombre, dto.titulo, dto.cuerpo, dto.categoria, cuentaId],
    );
    return aAviso(await this.obtenerFilaOFallar(id));
  }

  /** Corrige un aviso propio rechazado y lo vuelve a poner en cola. */
  async reenviarTrasRechazo(id: string, dto: ReenviarAvisoDto, cuentaId: string): Promise<Aviso> {
    const fila = await this.obtenerFilaOFallar(id);
    if (fila.creado_por_cuenta_id !== cuentaId) {
      throw new ForbiddenException("Solo quien redactó este aviso puede corregirlo.");
    }
    if (fila.estado !== "rechazado") {
      throw new ForbiddenException("Solo se puede corregir un aviso que fue rechazado.");
    }
    await this.bd.consultar(
      `UPDATE avisos
       SET titulo = $2, cuerpo = $3, categoria = $4, estado = 'pendiente',
           validado_por_cuenta_id = NULL, motivo_rechazo = NULL, publicado_en = now()
       WHERE id = $1`,
      [id, dto.titulo, dto.cuerpo, dto.categoria],
    );
    return aAviso(await this.obtenerFilaOFallar(id));
  }

  async aprobar(id: string, cuenta: Cuenta): Promise<Aviso> {
    const fila = await this.obtenerFilaOFallar(id);
    if (!dentroDelAlcance(cuenta, fila.distrito_ubigeo)) {
      throw new ForbiddenException("Este aviso no está dentro de tus distritos asignados.");
    }
    await this.bd.consultar(
      `UPDATE avisos
       SET estado = 'publicado', publicado_en = now(), validado_por_cuenta_id = $2, motivo_rechazo = NULL
       WHERE id = $1`,
      [id, cuenta.id],
    );
    await this.auditoria.registrar("aprobar", "aviso", id, cuenta.id);
    // Best-effort — nunca bloquea la aprobación si el envío falla (ver NotificacionesPushService).
    void this.notificacionesPush.notificarComunidad(fila.comunidad_id, fila.titulo, fila.cuerpo);
    return aAviso(await this.obtenerFilaOFallar(id));
  }

  async rechazar(id: string, motivo: string, cuenta: Cuenta): Promise<Aviso> {
    const fila = await this.obtenerFilaOFallar(id);
    if (!dentroDelAlcance(cuenta, fila.distrito_ubigeo)) {
      throw new ForbiddenException("Este aviso no está dentro de tus distritos asignados.");
    }
    await this.bd.consultar(
      `UPDATE avisos SET estado = 'rechazado', validado_por_cuenta_id = $2, motivo_rechazo = $3 WHERE id = $1`,
      [id, cuenta.id, motivo],
    );
    await this.auditoria.registrar("rechazar", "aviso", id, cuenta.id, { motivo });
    return aAviso(await this.obtenerFilaOFallar(id));
  }

  /**
   * Baja lógica, no DELETE físico — mismo criterio que cuentas/usuarios_app (ver
   * docs/decisiones/0021-endurecimiento-post-diagnostico.md).
   */
  async eliminar(id: string, cuentaQueActua: string): Promise<void> {
    const { rowCount } = await this.bd.consultar(
      "UPDATE avisos SET eliminado_en = now() WHERE id = $1 AND eliminado_en IS NULL",
      [id],
    );
    if (!rowCount) throw new NotFoundException(`No existe un aviso con id "${id}"`);
    await this.auditoria.registrar("eliminar", "aviso", id, cuentaQueActua);
  }
}
