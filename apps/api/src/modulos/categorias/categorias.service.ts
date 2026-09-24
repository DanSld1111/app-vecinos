import { randomUUID } from "crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Categoria } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { CrearCategoriaDto } from "./dto/crear-categoria.dto";
import { ActualizarCategoriaDto } from "./dto/actualizar-categoria.dto";
import { CARPETA_FOTOS_CATEGORIA } from "./foto-categoria.config";

interface FilaCategoria {
  id: string;
  padre_id: string | null;
  nombre: string;
  slug: string;
  icono: string;
  foto_url: string | null;
  orden: number;
  arquetipo_ficha: Categoria["arquetipoFicha"] | null;
  arquetipo_id: string | null;
  atributos_producto: Categoria["atributosProducto"] | null;
  servicio_slug: string | null;
}

const COLUMNAS =
  "id, padre_id, nombre, slug, icono, foto_url, orden, arquetipo_ficha, arquetipo_id, atributos_producto, servicio_slug";

function aCategoria(fila: FilaCategoria): Categoria {
  return {
    id: fila.id,
    padreId: fila.padre_id,
    nombre: fila.nombre,
    slug: fila.slug,
    icono: fila.icono,
    fotoUrl: fila.foto_url,
    orden: fila.orden,
    arquetipoFicha: fila.arquetipo_ficha ?? undefined,
    arquetipoId: fila.arquetipo_id ?? undefined,
    atributosProducto: fila.atributos_producto ?? undefined,
    servicioSlug: fila.servicio_slug,
  };
}

function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class CategoriasService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly almacenamiento: AlmacenamientoService,
  ) {}

  /**
   * Sin paginación a propósito: es el catálogo completo de categorías de la app
   * (decenas, no miles de filas), y varias pantallas necesitan el árbol entero de
   * una sola vez para armar el menú de Servicios. Distinto del caso de negocios,
   * que sí puede crecer sin límite por comunidad.
   */
  async listarTodas(): Promise<Categoria[]> {
    const { rows } = await this.bd.consultar<FilaCategoria>(
      `SELECT ${COLUMNAS} FROM categorias ORDER BY orden`,
    );
    return rows.map(aCategoria);
  }

  private async obtenerFilaOFallar(id: string): Promise<FilaCategoria> {
    const { rows } = await this.bd.consultar<FilaCategoria>(
      `SELECT ${COLUMNAS} FROM categorias WHERE id = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`No existe una categoría con id "${id}"`);
    return rows[0];
  }

  async crear(dto: CrearCategoriaDto): Promise<Categoria> {
    const slug = slugificar(dto.nombre);
    const id = `cat-${slug}-${randomUUID().slice(0, 8)}`;
    const { rows } = await this.bd.consultar<{ siguiente: number }>(
      "SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM categorias",
    );
    await this.bd.consultar(
      `INSERT INTO categorias (id, padre_id, nombre, slug, icono, orden, arquetipo_id, servicio_slug)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7)`,
      [id, dto.nombre, slug, dto.icono, rows[0].siguiente, dto.arquetipoId ?? null, dto.servicioSlug ?? null],
    );
    return aCategoria(await this.obtenerFilaOFallar(id));
  }

  async actualizar(id: string, dto: ActualizarCategoriaDto): Promise<Categoria> {
    await this.obtenerFilaOFallar(id);
    await this.bd.consultar(
      `UPDATE categorias
       SET nombre = COALESCE($2, nombre),
           slug = CASE WHEN $2::text IS NOT NULL THEN $3 ELSE slug END,
           icono = COALESCE($4, icono),
           arquetipo_id = CASE WHEN $5 THEN $6 ELSE arquetipo_id END,
           servicio_slug = CASE WHEN $7 THEN $8 ELSE servicio_slug END
       WHERE id = $1`,
      [
        id,
        dto.nombre ?? null,
        dto.nombre ? slugificar(dto.nombre) : null,
        dto.icono ?? null,
        "arquetipoId" in dto,
        dto.arquetipoId ?? null,
        "servicioSlug" in dto,
        dto.servicioSlug ?? null,
      ],
    );
    return aCategoria(await this.obtenerFilaOFallar(id));
  }

  /** Igual que NegociosService.actualizarFoto: borra el archivo anterior de Supabase Storage al reemplazarlo. */
  async actualizarFoto(id: string, archivo: Express.Multer.File): Promise<Categoria> {
    const fila = await this.obtenerFilaOFallar(id);
    const anterior = fila.foto_url;

    const url = await this.almacenamiento.subir(CARPETA_FOTOS_CATEGORIA, archivo.buffer, archivo.originalname, archivo.mimetype);
    await this.bd.consultar("UPDATE categorias SET foto_url = $2 WHERE id = $1", [id, url]);
    await this.almacenamiento.eliminarPorUrl(anterior);

    return aCategoria(await this.obtenerFilaOFallar(id));
  }
}
