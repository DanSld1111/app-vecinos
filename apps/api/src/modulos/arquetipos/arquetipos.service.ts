import { randomUUID } from "crypto";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Arquetipo } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { CrearArquetipoDto } from "./dto/crear-arquetipo.dto";
import { ActualizarArquetipoDto } from "./dto/actualizar-arquetipo.dto";
import { COLUMNAS_ARQUETIPO, FilaArquetipo, aArquetipo } from "./arquetipos.mapeo";

/** 23503 = foreign_key_violation — alguna categoría todavía referencia este arquetipo. */
function esErrorReferenciado(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23503";
}

@Injectable()
export class ArquetiposService {
  constructor(private readonly bd: BaseDatosService) {}

  /**
   * Solo lo consume el panel admin (armar la ficha de un negocio según su categoría) — la app
   * móvil todavía renderiza sus 5 fichas fijas vía el campo `arquetipoFicha` deprecado en
   * Categoria, no lee este catálogo. Por eso no hay ruta pública, solo `super_admin`.
   */
  async listarTodos(): Promise<Arquetipo[]> {
    const { rows } = await this.bd.consultar<FilaArquetipo>(
      `SELECT ${COLUMNAS_ARQUETIPO} FROM arquetipos ORDER BY nombre`,
    );
    return rows.map(aArquetipo);
  }

  private async obtenerFilaOFallar(id: string): Promise<FilaArquetipo> {
    const { rows } = await this.bd.consultar<FilaArquetipo>(
      `SELECT ${COLUMNAS_ARQUETIPO} FROM arquetipos WHERE id = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un arquetipo con id "${id}"`);
    return rows[0];
  }

  async crear(dto: CrearArquetipoDto): Promise<Arquetipo> {
    const id = `arq-${randomUUID().slice(0, 8)}`;
    await this.bd.consultar(
      `INSERT INTO arquetipos (id, nombre, icono, plantilla_id, origen, campos)
       VALUES ($1, $2, $3, $4, 'personalizado', $5::jsonb)`,
      [id, dto.nombre, dto.icono, dto.plantillaId, JSON.stringify(dto.campos)],
    );
    return aArquetipo(await this.obtenerFilaOFallar(id));
  }

  /**
   * `plantillaId` no se puede cambiar después de creado (mismo criterio que el panel ya
   * aplicaba en memoria) — cambiar de plantilla implicaría un set de campos totalmente
   * distinto, así que en la práctica es "crear otro arquetipo".
   */
  async actualizar(id: string, dto: ActualizarArquetipoDto): Promise<Arquetipo> {
    await this.obtenerFilaOFallar(id);
    await this.bd.consultar(
      `UPDATE arquetipos
       SET nombre = COALESCE($2, nombre),
           icono = COALESCE($3, icono),
           campos = COALESCE($4::jsonb, campos)
       WHERE id = $1`,
      [id, dto.nombre ?? null, dto.icono ?? null, dto.campos ? JSON.stringify(dto.campos) : null],
    );
    return aArquetipo(await this.obtenerFilaOFallar(id));
  }

  /** Igual que en el panel: si alguna categoría todavía lo usa, la propia FK de la base lo impide. */
  async eliminar(id: string): Promise<void> {
    await this.obtenerFilaOFallar(id);
    try {
      await this.bd.consultar("DELETE FROM arquetipos WHERE id = $1", [id]);
    } catch (error) {
      if (esErrorReferenciado(error)) {
        throw new ConflictException("Este arquetipo todavía está asignado a una o más categorías.");
      }
      throw error;
    }
  }
}
