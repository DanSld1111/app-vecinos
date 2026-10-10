import { randomUUID } from "crypto";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ComentarioPublicacion, ModulosApp, Publicacion } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { GuardarPublicacionDto } from "./dto/guardar-publicacion.dto";

export const CARPETA_PARA_TI = "para-ti";

// La API solo importa TIPOS de @app-vecinos/tipos: en producción ese paquete no se puede cargar en
// tiempo de ejecución (Render se cayó por esto). Estos dos valores repiten los de para-ti.ts.
const MAX_DESTACADAS = 10;
function idYoutube(enlace: string | null | undefined): string | null {
  if (!enlace) return null;
  const m = enlace.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
const AUTOR = "ELISUR";

interface FilaPublicacion {
  id: string;
  tipo: Publicacion["tipo"];
  texto: string;
  fotos: string[];
  video_url: string | null;
  portada_url: string | null;
  enlace_url: string | null;
  enlace_titulo: string | null;
  enlace_miniatura: string | null;
  estado: Publicacion["estado"];
  permite_comentarios: boolean;
  destacada_hasta: Date | null;
  corazones: number;
  compartidos: number;
  comentarios: string;
  creado_en: Date;
  publicado_en: Date | null;
  actualizado_en: Date;
}

const COLUMNAS = `p.id, p.tipo, p.texto, p.fotos, p.video_url, p.portada_url, p.enlace_url, p.enlace_titulo,
  p.enlace_miniatura, p.estado, p.permite_comentarios, p.destacada_hasta, p.corazones, p.compartidos,
  (SELECT COUNT(*) FROM publicacion_comentarios c WHERE c.publicacion_id = p.id AND NOT c.oculto) AS comentarios,
  p.creado_en, p.publicado_en, p.actualizado_en`;

function aPublicacion(f: FilaPublicacion): Publicacion {
  return {
    id: f.id,
    tipo: f.tipo,
    texto: f.texto,
    fotos: f.fotos ?? [],
    videoUrl: f.video_url,
    portadaUrl: f.portada_url,
    enlaceUrl: f.enlace_url,
    enlaceTitulo: f.enlace_titulo,
    enlaceMiniatura: f.enlace_miniatura,
    estado: f.estado,
    permiteComentarios: f.permite_comentarios,
    destacadaHasta: f.destacada_hasta ? f.destacada_hasta.toISOString() : null,
    corazones: f.corazones,
    compartidos: f.compartidos,
    comentarios: Number(f.comentarios),
    autor: AUTOR,
    creadoEn: f.creado_en.toISOString(),
    publicadoEn: f.publicado_en ? f.publicado_en.toISOString() : null,
    actualizadoEn: f.actualizado_en.toISOString(),
  };
}

interface FilaComentario {
  id: string;
  publicacion_id: string;
  texto: string;
  creado_en: Date;
  nombre: string | null;
  apellido: string | null;
  oculto: boolean;
  reportes: number;
  publicacion_texto?: string | null;
}

function aComentario(f: FilaComentario, conModeracion = false): ComentarioPublicacion {
  const inicial = f.apellido?.trim() ? ` ${f.apellido.trim()[0].toUpperCase()}.` : "";
  return {
    id: f.id,
    publicacionId: f.publicacion_id,
    texto: f.texto,
    autorNombre: `${(f.nombre ?? "Vecino").trim()}${inicial}`,
    creadoEn: f.creado_en.toISOString(),
    ...(conModeracion ? { oculto: f.oculto, reportes: f.reportes, publicacionTexto: (f.publicacion_texto ?? "").slice(0, 120) } : {}),
  };
}

/**
 * "Para ti" (decisión 0091): publicaciones para todos los distritos. La parte pública solo
 * responde si el módulo está encendido; el panel (super admin y editor de redes) siempre.
 */
@Injectable()
export class ParaTiService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly almacenamiento: AlmacenamientoService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ---------- Módulos de la app ----------

  async modulos(): Promise<ModulosApp> {
    const { rows } = await this.bd.consultar<{ clave: string; activo: boolean }>("SELECT clave, activo FROM modulos_app");
    const activo = (clave: string, porDefecto: boolean) => rows.find((r) => r.clave === clave)?.activo ?? porDefecto;
    return { comunidad: activo("comunidad", true), paraTi: activo("para_ti", false) };
  }

  async actualizarModulo(clave: string, activo: boolean, cuentaId: string): Promise<ModulosApp> {
    if (clave !== "comunidad" && clave !== "para_ti") throw new NotFoundException(`No existe el módulo "${clave}"`);
    await this.bd.consultar(
      `INSERT INTO modulos_app (clave, activo, actualizado_en, actualizado_por) VALUES ($1, $2, now(), $3)
       ON CONFLICT (clave) DO UPDATE SET activo = $2, actualizado_en = now(), actualizado_por = $3`,
      [clave, activo, cuentaId],
    );
    await this.auditoria.registrar(activo ? "encender" : "apagar", "modulo", clave, cuentaId);
    return this.modulos();
  }

  private async verificarEncendido(): Promise<void> {
    if (!(await this.modulos()).paraTi) throw new NotFoundException("Para ti no está disponible.");
  }

  // ---------- Lectura pública ----------

  async listarPublicadas(antesDe: string | undefined, limite = 15): Promise<{ items: Publicacion[]; cursorSiguiente: string | null }> {
    await this.verificarEncendido();
    const tope = Math.min(Math.max(limite, 1), 30);
    const { rows } = await this.bd.consultar<FilaPublicacion>(
      `SELECT ${COLUMNAS} FROM publicaciones p
       WHERE p.estado = 'publicada' AND ($1::timestamptz IS NULL OR p.publicado_en < $1::timestamptz)
       ORDER BY p.publicado_en DESC LIMIT $2`,
      [antesDe ?? null, tope + 1],
    );
    const items = rows.slice(0, tope).map(aPublicacion);
    return { items, cursorSiguiente: rows.length > tope ? items[items.length - 1].publicadoEn : null };
  }

  async destacadas(): Promise<Publicacion[]> {
    await this.verificarEncendido();
    const { rows } = await this.bd.consultar<FilaPublicacion>(
      `SELECT ${COLUMNAS} FROM publicaciones p
       WHERE p.estado = 'publicada' AND p.destacada_hasta > now()
       ORDER BY p.publicado_en DESC LIMIT $1`,
      [MAX_DESTACADAS],
    );
    return rows.map(aPublicacion);
  }

  async obtenerPublicada(id: string): Promise<Publicacion> {
    await this.verificarEncendido();
    const p = await this.obtener(id);
    if (p.estado !== "publicada") throw new NotFoundException("Esta publicación no existe o ya no está disponible.");
    return p;
  }

  async compartir(id: string): Promise<void> {
    await this.obtenerPublicada(id);
    await this.bd.consultar("UPDATE publicaciones SET compartidos = compartidos + 1 WHERE id = $1", [id]);
  }

  // ---------- Corazones (vecinos con cuenta) ----------

  async misCorazones(usuarioId: string): Promise<string[]> {
    const { rows } = await this.bd.consultar<{ publicacion_id: string }>(
      "SELECT publicacion_id FROM publicacion_corazones WHERE usuario_id = $1",
      [usuarioId],
    );
    return rows.map((r) => r.publicacion_id);
  }

  async darCorazon(id: string, usuarioId: string): Promise<{ corazones: number }> {
    await this.obtenerPublicada(id);
    await this.bd.transaccion(async (db) => {
      const { rowCount } = await db.consultar(
        "INSERT INTO publicacion_corazones (publicacion_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, usuarioId],
      );
      if (rowCount) await db.consultar("UPDATE publicaciones SET corazones = corazones + 1 WHERE id = $1", [id]);
    });
    return this.contarCorazones(id);
  }

  async quitarCorazon(id: string, usuarioId: string): Promise<{ corazones: number }> {
    await this.bd.transaccion(async (db) => {
      const { rowCount } = await db.consultar(
        "DELETE FROM publicacion_corazones WHERE publicacion_id = $1 AND usuario_id = $2",
        [id, usuarioId],
      );
      if (rowCount) await db.consultar("UPDATE publicaciones SET corazones = GREATEST(corazones - 1, 0) WHERE id = $1", [id]);
    });
    return this.contarCorazones(id);
  }

  private async contarCorazones(id: string): Promise<{ corazones: number }> {
    const { rows } = await this.bd.consultar<{ corazones: number }>("SELECT corazones FROM publicaciones WHERE id = $1", [id]);
    return { corazones: rows[0]?.corazones ?? 0 };
  }

  // ---------- Comentarios ----------

  async comentarios(id: string): Promise<ComentarioPublicacion[]> {
    const p = await this.obtenerPublicada(id);
    if (!p.permiteComentarios) return [];
    const { rows } = await this.bd.consultar<FilaComentario>(
      `SELECT c.id, c.publicacion_id, c.texto, c.creado_en, c.oculto, c.reportes, u.nombre, u.apellido
       FROM publicacion_comentarios c LEFT JOIN usuarios_app u ON u.id = c.usuario_id
       WHERE c.publicacion_id = $1 AND NOT c.oculto
       ORDER BY c.creado_en DESC LIMIT 200`,
      [id],
    );
    return rows.map((f) => aComentario(f));
  }

  async comentar(id: string, usuarioId: string, texto: string): Promise<ComentarioPublicacion> {
    const p = await this.obtenerPublicada(id);
    if (!p.permiteComentarios) throw new ForbiddenException("Los comentarios están desactivados en esta publicación.");
    const limpio = texto.trim();
    if (!limpio) throw new BadRequestException("Escribe algo antes de comentar.");
    const comentarioId = `com-${randomUUID()}`;
    await this.bd.consultar(
      "INSERT INTO publicacion_comentarios (id, publicacion_id, usuario_id, texto) VALUES ($1, $2, $3, $4)",
      [comentarioId, id, usuarioId, limpio],
    );
    const { rows } = await this.bd.consultar<FilaComentario>(
      `SELECT c.id, c.publicacion_id, c.texto, c.creado_en, c.oculto, c.reportes, u.nombre, u.apellido
       FROM publicacion_comentarios c LEFT JOIN usuarios_app u ON u.id = c.usuario_id WHERE c.id = $1`,
      [comentarioId],
    );
    return aComentario(rows[0]);
  }

  async reportarComentario(comentarioId: string, usuarioId: string): Promise<void> {
    await this.bd.transaccion(async (db) => {
      const { rows } = await db.consultar<{ id: string }>("SELECT id FROM publicacion_comentarios WHERE id = $1", [comentarioId]);
      if (!rows[0]) throw new NotFoundException("Ese comentario ya no existe.");
      const { rowCount } = await db.consultar(
        "INSERT INTO comentario_reportes (comentario_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [comentarioId, usuarioId],
      );
      if (rowCount) await db.consultar("UPDATE publicacion_comentarios SET reportes = reportes + 1 WHERE id = $1", [comentarioId]);
    });
  }

  // ---------- Panel (super admin y editor de redes) ----------

  async obtener(id: string): Promise<Publicacion> {
    const { rows } = await this.bd.consultar<FilaPublicacion>(`SELECT ${COLUMNAS} FROM publicaciones p WHERE p.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException("Esta publicación no existe o ya no está disponible.");
    return aPublicacion(rows[0]);
  }

  async listarAdmin(): Promise<Publicacion[]> {
    const { rows } = await this.bd.consultar<FilaPublicacion>(
      `SELECT ${COLUMNAS} FROM publicaciones p ORDER BY COALESCE(p.publicado_en, p.creado_en) DESC LIMIT 500`,
    );
    return rows.map(aPublicacion);
  }

  /** Revisa que la publicación tenga lo que pide su tipo y completa la vista previa de YouTube. */
  private async normalizar(dto: GuardarPublicacionDto, anterior?: Publicacion) {
    const texto = (dto.texto ?? "").trim();
    const fotos = dto.tipo === "fotos" ? (dto.fotos ?? []).filter(Boolean) : [];
    const propia = (url: string | null | undefined) =>
      !url || this.almacenamiento.esPropia(url) || (anterior && [anterior.videoUrl, anterior.portadaUrl, ...anterior.fotos].includes(url));
    if (fotos.some((f) => !propia(f)) || !propia(dto.videoUrl) || !propia(dto.portadaUrl)) {
      throw new BadRequestException("Hay un archivo que no se subió desde el panel. Súbelo de nuevo.");
    }
    let enlace = { url: null as string | null, titulo: null as string | null, miniatura: null as string | null };
    if (dto.tipo === "texto" && !texto) throw new BadRequestException("Escribe el texto de la publicación.");
    if (dto.tipo === "fotos" && fotos.length === 0) throw new BadRequestException("Sube al menos una foto.");
    if (dto.tipo === "video" && !dto.videoUrl) throw new BadRequestException("Sube el video antes de guardar.");
    if (dto.tipo === "youtube") {
      const vista = await this.vistaPreviaYoutube(dto.enlaceUrl ?? "");
      enlace = { url: vista.enlaceUrl, titulo: vista.titulo, miniatura: vista.miniatura };
    }
    return {
      texto,
      fotos,
      videoUrl: dto.tipo === "video" ? dto.videoUrl ?? null : null,
      portadaUrl: dto.tipo === "video" ? dto.portadaUrl ?? null : null,
      enlace,
    };
  }

  async crear(dto: GuardarPublicacionDto, cuentaId: string): Promise<Publicacion> {
    const n = await this.normalizar(dto);
    const id = `pub-${randomUUID()}`;
    const dias = dto.diasDestacada ?? 0;
    await this.bd.consultar(
      `INSERT INTO publicaciones (id, tipo, texto, fotos, video_url, portada_url, enlace_url, enlace_titulo, enlace_miniatura,
                                  estado, permite_comentarios, destacada_hasta, creado_por, publicado_en)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11,
               CASE WHEN $12::int > 0 THEN now() + make_interval(days => $12::int) ELSE NULL END,
               $13, CASE WHEN $10 = 'publicada' THEN now() ELSE NULL END)`,
      [id, dto.tipo, n.texto, JSON.stringify(n.fotos), n.videoUrl, n.portadaUrl, n.enlace.url, n.enlace.titulo, n.enlace.miniatura,
       dto.estado, dto.permiteComentarios ?? false, dias, cuentaId],
    );
    await this.auditoria.registrar(dto.estado === "publicada" ? "publicar" : "crear", "publicacion", id, cuentaId, { tipo: dto.tipo });
    return this.obtener(id);
  }

  async actualizar(id: string, dto: GuardarPublicacionDto, cuentaId: string): Promise<Publicacion> {
    const anterior = await this.obtener(id);
    const n = await this.normalizar(dto, anterior);
    await this.bd.consultar(
      `UPDATE publicaciones SET
         tipo = $2, texto = $3, fotos = $4::jsonb, video_url = $5, portada_url = $6,
         enlace_url = $7, enlace_titulo = $8, enlace_miniatura = $9, estado = $10, permite_comentarios = $11,
         destacada_hasta = CASE WHEN $12::int IS NULL THEN destacada_hasta
                                WHEN $12::int = 0 THEN NULL
                                ELSE now() + make_interval(days => $12::int) END,
         publicado_en = CASE WHEN $10 = 'publicada' THEN COALESCE(publicado_en, now()) ELSE NULL END,
         actualizado_en = now()
       WHERE id = $1`,
      [id, dto.tipo, n.texto, JSON.stringify(n.fotos), n.videoUrl, n.portadaUrl, n.enlace.url, n.enlace.titulo, n.enlace.miniatura,
       dto.estado, dto.permiteComentarios ?? anterior.permiteComentarios, dto.diasDestacada ?? null],
    );
    // Archivos que dejó de usar (fotos quitadas, video reemplazado).
    const enUso = new Set([...n.fotos, n.videoUrl, n.portadaUrl]);
    for (const url of [...anterior.fotos, anterior.videoUrl, anterior.portadaUrl]) {
      if (url && !enUso.has(url)) await this.almacenamiento.eliminarPorUrl(url);
    }
    const accion = anterior.estado !== "publicada" && dto.estado === "publicada" ? "publicar" : "actualizar";
    await this.auditoria.registrar(accion, "publicacion", id, cuentaId);
    return this.obtener(id);
  }

  async eliminar(id: string, cuentaId: string): Promise<void> {
    const p = await this.obtener(id);
    await this.bd.consultar("DELETE FROM publicaciones WHERE id = $1", [id]);
    for (const url of [...p.fotos, p.videoUrl, p.portadaUrl]) await this.almacenamiento.eliminarPorUrl(url);
    await this.auditoria.registrar("eliminar", "publicacion", id, cuentaId, { texto: p.texto.slice(0, 80) });
  }

  async subirFoto(archivo: Express.Multer.File): Promise<{ url: string }> {
    const url = await this.almacenamiento.subir(`${CARPETA_PARA_TI}/fotos`, archivo.buffer, archivo.originalname, archivo.mimetype);
    return { url };
  }

  firmarVideo(nombre: string): Promise<{ urlSubida: string; urlPublica: string }> {
    return this.almacenamiento.firmarSubida(`${CARPETA_PARA_TI}/videos`, nombre);
  }

  /** Título y miniatura de un video de YouTube a partir de su enlace (oEmbed público de YouTube). */
  async vistaPreviaYoutube(enlace: string): Promise<{ enlaceUrl: string; titulo: string | null; miniatura: string }> {
    const videoId = idYoutube(enlace);
    if (!videoId) throw new BadRequestException("Ese enlace no es de un video de YouTube.");
    const enlaceUrl = `https://www.youtube.com/watch?v=${videoId}`;
    let titulo: string | null = null;
    let miniatura = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(enlaceUrl)}&format=json`);
      if (r.ok) {
        const j = (await r.json()) as { title?: string; thumbnail_url?: string };
        titulo = j.title ?? null;
        miniatura = j.thumbnail_url ?? miniatura;
      }
    } catch {
      // Sin título: la miniatura igual se arma con el id.
    }
    return { enlaceUrl, titulo, miniatura };
  }

  async comentariosAdmin(filtro: "reportados" | "todos"): Promise<ComentarioPublicacion[]> {
    const { rows } = await this.bd.consultar<FilaComentario>(
      `SELECT c.id, c.publicacion_id, c.texto, c.creado_en, c.oculto, c.reportes, u.nombre, u.apellido, p.texto AS publicacion_texto
       FROM publicacion_comentarios c
       LEFT JOIN usuarios_app u ON u.id = c.usuario_id
       JOIN publicaciones p ON p.id = c.publicacion_id
       WHERE ($1 = 'todos' OR c.reportes > 0)
       ORDER BY ${filtro === "reportados" ? "c.reportes DESC," : ""} c.creado_en DESC LIMIT 300`,
      [filtro],
    );
    return rows.map((f) => aComentario(f, true));
  }

  async ocultarComentario(comentarioId: string, oculto: boolean, cuentaId: string): Promise<void> {
    const { rowCount } = await this.bd.consultar("UPDATE publicacion_comentarios SET oculto = $2 WHERE id = $1", [comentarioId, oculto]);
    if (!rowCount) throw new NotFoundException("Ese comentario ya no existe.");
    await this.auditoria.registrar(oculto ? "ocultar" : "mostrar", "comentario", comentarioId, cuentaId);
  }

  async eliminarComentario(comentarioId: string, cuentaId: string): Promise<void> {
    const { rowCount } = await this.bd.consultar("DELETE FROM publicacion_comentarios WHERE id = $1", [comentarioId]);
    if (!rowCount) throw new NotFoundException("Ese comentario ya no existe.");
    await this.auditoria.registrar("eliminar", "comentario", comentarioId, cuentaId);
  }
}
