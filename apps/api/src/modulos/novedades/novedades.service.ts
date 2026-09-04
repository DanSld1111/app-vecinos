import { randomUUID } from "crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Novedad } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { CrearNovedadDto } from "./dto/crear-novedad.dto";
import { ActualizarNovedadDto } from "./dto/actualizar-novedad.dto";
import { COLUMNAS_NOVEDAD, FilaNovedad, aNovedad } from "./novedades.mapeo";

@Injectable()
export class NovedadesService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /** Lectura pública que consume la app del vecino (Notificaciones → Novedades): solo lo visible. */
  async listar(): Promise<Novedad[]> {
    const { rows } = await this.bd.consultar<FilaNovedad>(
      `SELECT ${COLUMNAS_NOVEDAD} FROM novedades WHERE activo ORDER BY publicado_en DESC`,
    );
    return rows.map(aNovedad);
  }

  /** Panel admin: todas, visibles u ocultas, para poder gestionarlas. */
  async listarAdmin(): Promise<Novedad[]> {
    const { rows } = await this.bd.consultar<FilaNovedad>(
      `SELECT ${COLUMNAS_NOVEDAD} FROM novedades ORDER BY publicado_en DESC`,
    );
    return rows.map(aNovedad);
  }

  private async obtenerFilaOFallar(id: string): Promise<FilaNovedad> {
    const { rows } = await this.bd.consultar<FilaNovedad>(
      `SELECT ${COLUMNAS_NOVEDAD} FROM novedades WHERE id = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`No existe una novedad con id "${id}"`);
    return rows[0];
  }

  async crear(dto: CrearNovedadDto, cuentaQueActua: string): Promise<Novedad> {
    const id = `novedad-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO novedades (id, titulo, texto, publicado_en, activo) VALUES ($1, $2, $3, now(), true)`,
      [id, dto.titulo, dto.texto],
    );
    await this.auditoria.registrar("crear", "novedad", id, cuentaQueActua);
    return aNovedad(await this.obtenerFilaOFallar(id));
  }

  async actualizar(id: string, dto: ActualizarNovedadDto, cuentaQueActua: string): Promise<Novedad> {
    await this.obtenerFilaOFallar(id);
    await this.bd.consultar(
      `UPDATE novedades
       SET titulo = COALESCE($2, titulo), texto = COALESCE($3, texto), activo = COALESCE($4, activo)
       WHERE id = $1`,
      [id, dto.titulo ?? null, dto.texto ?? null, dto.activo ?? null],
    );
    await this.auditoria.registrar("actualizar", "novedad", id, cuentaQueActua, dto as Record<string, unknown>);
    return aNovedad(await this.obtenerFilaOFallar(id));
  }

  async eliminar(id: string, cuentaQueActua: string): Promise<void> {
    await this.obtenerFilaOFallar(id);
    await this.bd.consultar("DELETE FROM novedades WHERE id = $1", [id]);
    await this.auditoria.registrar("eliminar", "novedad", id, cuentaQueActua);
  }
}
