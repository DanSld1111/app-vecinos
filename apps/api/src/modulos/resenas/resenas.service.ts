import { randomUUID } from "crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Resena, ResumenResenas } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { SELECT_RESENA, FilaResena, aResena } from "./resenas.mapeo";
import { CrearResenaDto } from "./dto/crear-resena.dto";

@Injectable()
export class ResenasService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /** Lectura pública (ficha de negocio): nunca lo que un validador ocultó. */
  async listarPorNegocio(negocioId: string): Promise<Resena[]> {
    const { rows } = await this.bd.consultar<FilaResena>(
      `${SELECT_RESENA} WHERE r.negocio_id = $1 AND NOT r.oculta ORDER BY r.creado_en DESC`,
      [negocioId],
    );
    return rows.map(aResena);
  }

  async resumen(negocioId: string): Promise<ResumenResenas> {
    const { rows } = await this.bd.consultar<{ promedio: string | null; total: string }>(
      `SELECT AVG(calificacion)::numeric(3,2) AS promedio, COUNT(*) AS total
       FROM resenas WHERE negocio_id = $1 AND NOT oculta`,
      [negocioId],
    );
    return {
      promedio: rows[0]?.promedio ? Number(rows[0].promedio) : 0,
      total: rows[0] ? Number(rows[0].total) : 0,
    };
  }

  /** "Mi reseña" de este negocio, si ya dejó una — para que la app muestre "editar" en vez de "dejar reseña". */
  async obtenerPropia(negocioId: string, usuarioId: string): Promise<Resena | null> {
    const { rows } = await this.bd.consultar<FilaResena>(
      `${SELECT_RESENA} WHERE r.negocio_id = $1 AND r.usuario_id = $2`,
      [negocioId, usuarioId],
    );
    return rows[0] ? aResena(rows[0]) : null;
  }

  /**
   * Crear o editar: un vecino solo puede tener una reseña por negocio (constraint único en la
   * tabla) — volver a enviar es en realidad editar la propia, nunca duplicar.
   */
  async crearOActualizar(dto: CrearResenaDto, usuarioId: string): Promise<Resena> {
    const { rows: negocioExiste } = await this.bd.consultar("SELECT 1 FROM negocios WHERE id = $1", [dto.negocioId]);
    if (negocioExiste.length === 0) throw new NotFoundException(`No existe un negocio con id "${dto.negocioId}"`);

    const id = `resena-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO resenas (id, negocio_id, usuario_id, calificacion, comentario)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (negocio_id, usuario_id)
       DO UPDATE SET calificacion = $4, comentario = $5, actualizado_en = now()`,
      [id, dto.negocioId, usuarioId, dto.calificacion, dto.comentario ?? null],
    );
    const resena = await this.obtenerPropia(dto.negocioId, usuarioId);
    if (!resena) throw new NotFoundException("No se pudo guardar la reseña.");
    return resena;
  }

  /** El vecino borra su propia reseña — no requiere moderación, es contenido propio. */
  async eliminarPropia(id: string, usuarioId: string): Promise<void> {
    const { rowCount } = await this.bd.consultar("DELETE FROM resenas WHERE id = $1 AND usuario_id = $2", [
      id,
      usuarioId,
    ]);
    if (!rowCount) throw new NotFoundException(`No existe una reseña con id "${id}" para este usuario.`);
  }

  private async obtenerFilaOFallar(id: string): Promise<FilaResena> {
    const { rows } = await this.bd.consultar<FilaResena>(`${SELECT_RESENA} WHERE r.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException(`No existe una reseña con id "${id}"`);
    return rows[0];
  }

  /** Moderación: oculta una reseña (spam, lenguaje ofensivo) sin borrarla — mismo criterio que avisos/negocios. */
  async ocultar(id: string, cuentaId: string): Promise<Resena> {
    await this.obtenerFilaOFallar(id);
    await this.bd.consultar(
      "UPDATE resenas SET oculta = true, ocultada_por_cuenta_id = $2 WHERE id = $1",
      [id, cuentaId],
    );
    await this.auditoria.registrar("ocultar", "resena", id, cuentaId);
    return aResena(await this.obtenerFilaOFallar(id));
  }

  async mostrar(id: string, cuentaId: string): Promise<Resena> {
    await this.obtenerFilaOFallar(id);
    await this.bd.consultar("UPDATE resenas SET oculta = false, ocultada_por_cuenta_id = NULL WHERE id = $1", [id]);
    await this.auditoria.registrar("mostrar", "resena", id, cuentaId);
    return aResena(await this.obtenerFilaOFallar(id));
  }
}
