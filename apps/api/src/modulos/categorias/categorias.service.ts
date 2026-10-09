import { randomUUID } from "crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ArquetipoFicha, Categoria, TipoFicha } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { CrearCategoriaDto } from "./dto/crear-categoria.dto";
import { ActualizarCategoriaDto } from "./dto/actualizar-categoria.dto";
import { CampoProductoDto } from "./dto/campo-producto.dto";
import { CARPETA_FOTOS_CATEGORIA } from "./foto-categoria.config";

interface FilaCategoria {
  id: string;
  padre_id: string | null;
  nombre: string;
  slug: string;
  icono: string;
  foto_url: string | null;
  orden: number;
  ficha: TipoFicha | null;
  ficha_efectiva: TipoFicha;
  titulo_seccion: string | null;
  atributos_producto: Categoria["atributosProducto"] | null;
  servicio_slug: string | null;
  aviso_ficha: Categoria["avisoFicha"] | null;
}

// La ficha efectiva se resuelve aquí para que la app y el panel no repitan la regla: la propia de
// la categoría, si no la de su servicio, y si ninguno define una, la galería. Ver
// docs/decisiones/0080-fichas.md.
const COLUMNAS = `
  c.id, c.padre_id, c.nombre, c.slug, c.icono, c.foto_url, c.orden, c.ficha, c.titulo_seccion,
  c.atributos_producto, c.servicio_slug, c.aviso_ficha, COALESCE(c.ficha, s.ficha, 'galeria') AS ficha_efectiva`;
const DESDE = "categorias c LEFT JOIN servicios_app s ON s.slug = c.servicio_slug";

/** Para versiones viejas de la app, que todavía leen `arquetipoFicha`. */
const ARQUETIPO_LEGADO: Record<TipoFicha, ArquetipoFicha | undefined> = {
  menu: "menu",
  catalogo: "catalogo",
  servicios: "servicios",
  rubros: "categorias",
  ofertas: "ofertas",
  galeria: undefined,
};

function aCategoria(fila: FilaCategoria): Categoria {
  return {
    id: fila.id,
    padreId: fila.padre_id,
    nombre: fila.nombre,
    slug: fila.slug,
    icono: fila.icono,
    fotoUrl: fila.foto_url,
    orden: fila.orden,
    arquetipoFicha: ARQUETIPO_LEGADO[fila.ficha_efectiva],
    ficha: fila.ficha,
    fichaEfectiva: fila.ficha_efectiva,
    tituloSeccion: fila.titulo_seccion,
    atributosProducto: fila.atributos_producto ?? undefined,
    servicioSlug: fila.servicio_slug,
    avisoFicha: fila.aviso_ficha ?? null,
  };
}

/**
 * La clave de un campo es lo que queda guardado en cada producto (Producto.atributos), así que una
 * vez creada no cambia aunque se renombre la etiqueta. Los campos nuevos llegan sin clave: se
 * genera a partir de la etiqueta, sin repetir una existente.
 */
function normalizarCampos(campos: CampoProductoDto[]): NonNullable<Categoria["atributosProducto"]> {
  const usadas = new Set(campos.map((c) => c.clave).filter((c): c is string => Boolean(c)));
  return campos.map((c) => {
    let clave = c.clave;
    if (!clave) {
      const base = slugificar(c.etiqueta).replace(/-/g, "_") || "campo";
      clave = base;
      for (let i = 2; usadas.has(clave); i += 1) clave = `${base}_${i}`;
      usadas.add(clave);
    }
    const opciones = c.tipo === "opciones" ? (c.opciones ?? []).map((o) => o.trim()).filter(Boolean) : undefined;
    return {
      clave,
      etiqueta: c.etiqueta.trim(),
      tipo: c.tipo,
      ...(opciones ? { opciones } : {}),
      ...(c.oculto ? { oculto: true } : {}),
      ...(opciones && c.filtro ? { filtro: true } : {}),
      ...(opciones && c.insignia ? { insignia: true } : {}),
      // Solo si la opción existe en el campo; un sufijo de una opción borrada se descarta.
      ...(opciones && c.sufijoPrecio?.sufijo.trim() && opciones.includes(c.sufijoPrecio.opcion.trim())
        ? { sufijoPrecio: { opcion: c.sufijoPrecio.opcion.trim(), sufijo: c.sufijoPrecio.sufijo.trim() } }
        : {}),
    };
  });
}

function avisoJson(aviso: CrearCategoriaDto["avisoFicha"]): string | null {
  const texto = aviso?.texto?.trim();
  return aviso && texto ? JSON.stringify({ tipo: aviso.tipo, texto }) : null;
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
      `SELECT ${COLUMNAS} FROM ${DESDE} ORDER BY c.orden`,
    );
    return rows.map(aCategoria);
  }

  private async obtenerFilaOFallar(id: string): Promise<FilaCategoria> {
    const { rows } = await this.bd.consultar<FilaCategoria>(
      `SELECT ${COLUMNAS} FROM ${DESDE} WHERE c.id = $1`,
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
      `INSERT INTO categorias (id, padre_id, nombre, slug, icono, orden, servicio_slug, ficha, titulo_seccion, atributos_producto, aviso_ficha)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        dto.nombre,
        slug,
        dto.icono,
        rows[0].siguiente,
        dto.servicioSlug ?? null,
        dto.ficha ?? null,
        dto.tituloSeccion?.trim() || null,
        dto.atributosProducto ? JSON.stringify(normalizarCampos(dto.atributosProducto)) : null,
        avisoJson(dto.avisoFicha),
      ],
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
           servicio_slug = CASE WHEN $5 THEN $6 ELSE servicio_slug END,
           ficha = CASE WHEN $7 THEN $8 ELSE ficha END,
           titulo_seccion = CASE WHEN $9 THEN $10 ELSE titulo_seccion END,
           atributos_producto = CASE WHEN $11 THEN $12::jsonb ELSE atributos_producto END,
           aviso_ficha = CASE WHEN $13 THEN $14::jsonb ELSE aviso_ficha END
       WHERE id = $1`,
      [
        id,
        dto.nombre ?? null,
        dto.nombre ? slugificar(dto.nombre) : null,
        dto.icono ?? null,
        "servicioSlug" in dto,
        dto.servicioSlug ?? null,
        "ficha" in dto,
        dto.ficha ?? null,
        "tituloSeccion" in dto,
        dto.tituloSeccion?.trim() || null,
        "atributosProducto" in dto,
        dto.atributosProducto ? JSON.stringify(normalizarCampos(dto.atributosProducto)) : null,
        "avisoFicha" in dto,
        avisoJson(dto.avisoFicha),
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
