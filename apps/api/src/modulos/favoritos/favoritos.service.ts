import { randomUUID } from "crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Negocio } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { COLUMNAS_NEGOCIO, FilaNegocio, aNegocio } from "../negocios/negocios.mapeo";

@Injectable()
export class FavoritosService {
  constructor(private readonly bd: BaseDatosService) {}

  /** Los negocios favoritos del vecino, del más reciente al más viejo. */
  async listar(usuarioId: string): Promise<Negocio[]> {
    const { rows } = await this.bd.consultar<FilaNegocio>(
      `SELECT ${COLUMNAS_NEGOCIO}
       FROM favoritos f
       JOIN negocios n ON n.id = f.negocio_id
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE f.usuario_id = $1 AND n.estado = 'activo' AND n.archivado_en IS NULL
       GROUP BY n.id, f.creado_en
       ORDER BY f.creado_en DESC`,
      [usuarioId],
    );
    return rows.map(aNegocio);
  }

  /** Solo los ids — lo que usa cada ficha para saber si el corazón va lleno o no, sin traer el
   * negocio completo de cada uno. */
  async listarIds(usuarioId: string): Promise<string[]> {
    const { rows } = await this.bd.consultar<{ negocio_id: string }>(
      "SELECT negocio_id FROM favoritos WHERE usuario_id = $1",
      [usuarioId],
    );
    return rows.map((r) => r.negocio_id);
  }

  async agregar(usuarioId: string, negocioId: string): Promise<void> {
    const { rows } = await this.bd.consultar("SELECT 1 FROM negocios WHERE id = $1", [negocioId]);
    if (rows.length === 0) throw new NotFoundException(`No existe un negocio con id "${negocioId}"`);

    await this.bd.consultar(
      `INSERT INTO favoritos (id, usuario_id, negocio_id) VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id, negocio_id) DO NOTHING`,
      [`favorito-${randomUUID()}`, usuarioId, negocioId],
    );
  }

  async quitar(usuarioId: string, negocioId: string): Promise<void> {
    await this.bd.consultar("DELETE FROM favoritos WHERE usuario_id = $1 AND negocio_id = $2", [
      usuarioId,
      negocioId,
    ]);
  }
}
