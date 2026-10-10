import { randomUUID } from "crypto";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  ComentarioPublicacion,
  FiltroComentarios,
  MetricaParaTi,
  ModulosApp,
  MotivoReporte,
  Publicacion,
  ResumenComentarios,
} from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { GuardarPublicacionDto } from "./dto/guardar-publicacion.dto";

export const CARPETA_PARA_TI = "para-ti";

// La API solo importa TIPOS de @app-vecinos/tipos: en producción ese paquete no se puede cargar en
// tiempo de ejecución (Render se cayó por esto). Estos valores repiten los de para-ti.ts.
const MAX_DESTACADAS = 10;
const REPORTES_PARA_OCULTAR = 3;
const ZONA = "America/Lima";
/** Visible para los vecinos: publicada y con su fecha ya cumplida (las programadas esperan). */
const VISIBLE = "p.estado = 'publicada' AND p.publicado_en <= now()";
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
  destacada_orden: number | null;
  programada: boolean;
  corazones: number;
  compartidos: number;
  comentarios: string;
  creado_en: Date;
  publicado_en: Date | null;
  actualizado_en: Date;
}

const COLUMNAS = `p.id, p.tipo, p.texto, p.fotos, p.video_url, p.portada_url, p.enlace_url, p.enlace_titulo,
  p.enlace_miniatura, p.estado, p.permite_comentarios, p.destacada_hasta, p.destacada_orden,
  (p.estado = 'publicada' AND p.publicado_en > now()) AS programada, p.corazones, p.compartidos,
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
    destacadaOrden: f.destacada_orden,
    programada: f.programada,
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
  usuario_id: string | null;
  nombre: string | null;
  apellido: string | null;
  respuesta_a: string | null;
  fijado_en: Date | null;
  corazones: number;
  oculto: boolean;
  reportes: number;
  revisado: boolean;
  // Solo en el panel:
  comunidad?: string | null;
  silenciado_hasta?: Date | null;
  respondido?: boolean;
  motivos?: { motivo: MotivoReporte; cantidad: number }[] | null;
  publicacion_texto?: string | null;
  publicacion_tipo?: Publicacion["tipo"];
  publicacion_miniatura?: string | null;
  publicacion_comentarios?: string;
  publicacion_permite?: boolean;
}

const COLUMNAS_COMENTARIO = `c.id, c.publicacion_id, c.texto, c.creado_en, c.usuario_id, u.nombre, u.apellido, c.respuesta_a,
  c.fijado_en, c.corazones, c.oculto, c.reportes, c.revisado`;

const COLUMNAS_COMENTARIO_PANEL = `${COLUMNAS_COMENTARIO}, co.nombre AS comunidad, s.hasta AS silenciado_hasta,
  EXISTS (SELECT 1 FROM publicacion_comentarios r WHERE r.respuesta_a = c.id AND r.usuario_id IS NULL) AS respondido,
  (SELECT json_agg(json_build_object('motivo', m.motivo, 'cantidad', m.n) ORDER BY m.n DESC)
     FROM (SELECT motivo, COUNT(*)::int AS n FROM comentario_reportes cr WHERE cr.comentario_id = c.id GROUP BY motivo) m) AS motivos,
  p.texto AS publicacion_texto, p.tipo AS publicacion_tipo,
  COALESCE(p.fotos->>0, p.portada_url, p.enlace_miniatura) AS publicacion_miniatura,
  (SELECT COUNT(*) FROM publicacion_comentarios x WHERE x.publicacion_id = p.id AND NOT x.oculto) AS publicacion_comentarios,
  p.permite_comentarios AS publicacion_permite`;

const DESDE_COMENTARIO_PANEL = `FROM publicacion_comentarios c
  LEFT JOIN usuarios_app u ON u.id = c.usuario_id
  LEFT JOIN comunidades co ON co.id = u.comunidad_id
  LEFT JOIN para_ti_silenciados s ON s.usuario_id = c.usuario_id AND s.hasta > now()
  JOIN publicaciones p ON p.id = c.publicacion_id`;

/** Condición de cada bandeja del panel. */
const FILTRO_COMENTARIOS: Record<FiltroComentarios, string> = {
  reportados: "c.reportes > 0 AND NOT c.revisado",
  ocultos: "c.oculto",
  sin_responder: `c.usuario_id IS NOT NULL AND c.respuesta_a IS NULL AND NOT c.oculto
    AND NOT EXISTS (SELECT 1 FROM publicacion_comentarios r WHERE r.respuesta_a = c.id AND r.usuario_id IS NULL)`,
  todos: "true",
};

function aComentario(f: FilaComentario, conModeracion = false): ComentarioPublicacion {
  const oficial = f.usuario_id === null;
  const inicial = f.apellido?.trim() ? ` ${f.apellido.trim()[0].toUpperCase()}.` : "";
  return {
    id: f.id,
    publicacionId: f.publicacion_id,
    texto: f.texto,
    autorNombre: oficial ? AUTOR : `${(f.nombre ?? "Vecino").trim()}${inicial}`,
    creadoEn: f.creado_en.toISOString(),
    oficial,
    respuestaA: f.respuesta_a,
    fijado: f.fijado_en !== null,
    corazones: f.corazones,
    ...(conModeracion
      ? {
          oculto: f.oculto,
          reportes: f.reportes,
          revisado: f.revisado,
          motivos: f.motivos ?? [],
          usuarioId: f.usuario_id,
          autorComunidad: f.comunidad ?? null,
          silenciadoHasta: f.silenciado_hasta ? f.silenciado_hasta.toISOString() : null,
          respondido: f.respondido ?? false,
          publicacionTexto: (f.publicacion_texto ?? "").slice(0, 160),
          publicacionTipo: f.publicacion_tipo,
          publicacionMiniatura: f.publicacion_miniatura ?? null,
          publicacionComentarios: Number(f.publicacion_comentarios ?? 0),
          publicacionPermiteComentarios: f.publicacion_permite,
        }
      : {}),
  };
}

const MOTIVOS: MotivoReporte[] = ["publicidad", "ofensivo", "enganoso", "otro"];

/** Fecha programada válida: en el futuro y hasta 90 días. */
function fechaProgramada(iso: string): Date {
  const fecha = new Date(iso);
  const ahora = Date.now();
  if (Number.isNaN(fecha.getTime()) || fecha.getTime() < ahora + 60_000 || fecha.getTime() > ahora + 90 * 864e5) {
    throw new BadRequestException("La fecha programada tiene que ser en el futuro, hasta 90 días.");
  }
  return fecha;
}

/**
 * "Para ti" (decisiones 0091 y 0092): publicaciones para todos los distritos. La parte pública
 * solo responde si el módulo está encendido; el panel (super admin y editor de redes) siempre.
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

  /** El muro. `soloVideos` = la vista de videos en vertical; `q` = el buscador. */
  async listarPublicadas(
    antesDe: string | undefined,
    limite = 15,
    filtros: { q?: string; soloVideos?: boolean } = {},
  ): Promise<{ items: Publicacion[]; cursorSiguiente: string | null }> {
    await this.verificarEncendido();
    const tope = Math.min(Math.max(limite, 1), 30);
    const q = filtros.q?.trim().slice(0, 80) || null;
    const { rows } = await this.bd.consultar<FilaPublicacion>(
      `SELECT ${COLUMNAS} FROM publicaciones p
       WHERE ${VISIBLE} AND ($1::timestamptz IS NULL OR p.publicado_en < $1::timestamptz)
         AND ($3::text IS NULL OR p.texto ILIKE '%' || $3 || '%' OR p.enlace_titulo ILIKE '%' || $3 || '%')
         AND (NOT $4::boolean OR p.tipo IN ('video', 'youtube'))
       ORDER BY p.publicado_en DESC LIMIT $2`,
      [antesDe ?? null, tope + 1, q, Boolean(filtros.soloVideos)],
    );
    const items = rows.slice(0, tope).map(aPublicacion);
    return { items, cursorSiguiente: rows.length > tope ? items[items.length - 1].publicadoEn : null };
  }

  async destacadas(): Promise<Publicacion[]> {
    await this.verificarEncendido();
    return this.destacadasVigentes(true);
  }

  private async destacadasVigentes(soloVisibles: boolean): Promise<Publicacion[]> {
    const { rows } = await this.bd.consultar<FilaPublicacion>(
      `SELECT ${COLUMNAS} FROM publicaciones p
       WHERE ${soloVisibles ? VISIBLE : "p.estado = 'publicada'"} AND p.destacada_hasta > now()
       ORDER BY p.destacada_orden ASC NULLS LAST, p.publicado_en DESC LIMIT $1`,
      [MAX_DESTACADAS],
    );
    return rows.map(aPublicacion);
  }

  async obtenerPublicada(id: string): Promise<Publicacion> {
    await this.verificarEncendido();
    const p = await this.obtener(id);
    if (p.estado !== "publicada" || p.programada) throw new NotFoundException("Esta publicación no existe o ya no está disponible.");
    return p;
  }

  async compartir(id: string): Promise<void> {
    await this.obtenerPublicada(id);
    await this.bd.transaccion(async (db) => {
      await db.consultar("UPDATE publicaciones SET compartidos = compartidos + 1 WHERE id = $1", [id]);
      await db.consultar("INSERT INTO publicacion_compartidos (publicacion_id) VALUES ($1)", [id]);
    });
  }

  /** Un celular abrió Para ti hoy (para "Vecinos que abrieron Para ti" en el panel). */
  async registrarVisita(visitante: string): Promise<void> {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(visitante)) throw new BadRequestException("Visitante no válido.");
    await this.verificarEncendido();
    await this.bd.consultar(
      `INSERT INTO para_ti_visitas (dia, visitante) VALUES ((now() AT TIME ZONE '${ZONA}')::date, $1) ON CONFLICT DO NOTHING`,
      [visitante],
    );
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

  /** Principales y respuestas, sin los ocultos (ni las respuestas de un principal oculto). La app los agrupa. */
  async comentarios(id: string): Promise<ComentarioPublicacion[]> {
    const p = await this.obtenerPublicada(id);
    if (!p.permiteComentarios) return [];
    const { rows } = await this.bd.consultar<FilaComentario>(
      `SELECT ${COLUMNAS_COMENTARIO}
       FROM publicacion_comentarios c
       LEFT JOIN usuarios_app u ON u.id = c.usuario_id
       LEFT JOIN publicacion_comentarios padre ON padre.id = c.respuesta_a
       WHERE c.publicacion_id = $1 AND NOT c.oculto AND (padre.id IS NULL OR NOT padre.oculto)
       ORDER BY c.fijado_en DESC NULLS LAST, c.creado_en DESC LIMIT 400`,
      [id],
    );
    return rows.map((f) => aComentario(f));
  }

  /** Comentario principal al que se responde (si se responde a una respuesta, va al principal de ese hilo). */
  private async hiloDe(publicacionId: string, respuestaA: string | undefined): Promise<string | null> {
    if (!respuestaA) return null;
    const { rows } = await this.bd.consultar<{ id: string; respuesta_a: string | null; publicacion_id: string }>(
      "SELECT id, respuesta_a, publicacion_id FROM publicacion_comentarios WHERE id = $1",
      [respuestaA],
    );
    if (!rows[0] || rows[0].publicacion_id !== publicacionId) throw new BadRequestException("Ese comentario ya no existe.");
    return rows[0].respuesta_a ?? rows[0].id;
  }

  private async leerComentario(comentarioId: string, conModeracion = false): Promise<ComentarioPublicacion> {
    const { rows } = await this.bd.consultar<FilaComentario>(
      conModeracion
        ? `SELECT ${COLUMNAS_COMENTARIO_PANEL} ${DESDE_COMENTARIO_PANEL} WHERE c.id = $1`
        : `SELECT ${COLUMNAS_COMENTARIO} FROM publicacion_comentarios c LEFT JOIN usuarios_app u ON u.id = c.usuario_id WHERE c.id = $1`,
      [comentarioId],
    );
    if (!rows[0]) throw new NotFoundException("Ese comentario ya no existe.");
    return aComentario(rows[0], conModeracion);
  }

  async comentar(id: string, usuarioId: string, texto: string, respuestaA?: string): Promise<ComentarioPublicacion> {
    const p = await this.obtenerPublicada(id);
    if (!p.permiteComentarios) throw new ForbiddenException("Los comentarios están desactivados en esta publicación.");
    const { rows: silencio } = await this.bd.consultar<{ hasta: Date }>(
      "SELECT hasta FROM para_ti_silenciados WHERE usuario_id = $1 AND hasta > now()",
      [usuarioId],
    );
    if (silencio[0]) {
      const fecha = silencio[0].hasta.toLocaleDateString("es-PE", { day: "numeric", month: "long", timeZone: ZONA });
      throw new ForbiddenException(`Tus comentarios en Para ti están pausados hasta el ${fecha}.`);
    }
    const limpio = texto.trim();
    if (!limpio) throw new BadRequestException("Escribe algo antes de comentar.");
    const hilo = await this.hiloDe(id, respuestaA);
    const comentarioId = `com-${randomUUID()}`;
    await this.bd.consultar(
      "INSERT INTO publicacion_comentarios (id, publicacion_id, usuario_id, texto, respuesta_a) VALUES ($1, $2, $3, $4, $5)",
      [comentarioId, id, usuarioId, limpio, hilo],
    );
    return this.leerComentario(comentarioId);
  }

  async misCorazonesEnComentarios(usuarioId: string, publicacionId: string): Promise<string[]> {
    const { rows } = await this.bd.consultar<{ comentario_id: string }>(
      `SELECT cc.comentario_id FROM comentario_corazones cc
       JOIN publicacion_comentarios c ON c.id = cc.comentario_id
       WHERE cc.usuario_id = $1 AND c.publicacion_id = $2`,
      [usuarioId, publicacionId],
    );
    return rows.map((r) => r.comentario_id);
  }

  async corazonComentario(comentarioId: string, usuarioId: string, dar: boolean): Promise<{ corazones: number }> {
    const { rows } = await this.bd.consultar<{ publicacion_id: string }>(
      "SELECT publicacion_id FROM publicacion_comentarios WHERE id = $1 AND NOT oculto",
      [comentarioId],
    );
    if (!rows[0]) throw new NotFoundException("Ese comentario ya no existe.");
    await this.obtenerPublicada(rows[0].publicacion_id);
    await this.bd.transaccion(async (db) => {
      const { rowCount } = dar
        ? await db.consultar("INSERT INTO comentario_corazones (comentario_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [comentarioId, usuarioId])
        : await db.consultar("DELETE FROM comentario_corazones WHERE comentario_id = $1 AND usuario_id = $2", [comentarioId, usuarioId]);
      if (rowCount) {
        await db.consultar(
          `UPDATE publicacion_comentarios SET corazones = GREATEST(corazones ${dar ? "+" : "-"} 1, 0) WHERE id = $1`,
          [comentarioId],
        );
      }
    });
    const { rows: r } = await this.bd.consultar<{ corazones: number }>("SELECT corazones FROM publicacion_comentarios WHERE id = $1", [comentarioId]);
    return { corazones: r[0]?.corazones ?? 0 };
  }

  /** Con REPORTES_PARA_OCULTAR reportes el comentario se oculta solo, salvo que el panel ya lo haya revisado. */
  async reportarComentario(comentarioId: string, usuarioId: string, motivo: MotivoReporte = "otro"): Promise<void> {
    if (!MOTIVOS.includes(motivo)) throw new BadRequestException("Motivo no válido.");
    await this.bd.transaccion(async (db) => {
      const { rows } = await db.consultar<{ usuario_id: string | null }>("SELECT usuario_id FROM publicacion_comentarios WHERE id = $1", [comentarioId]);
      if (!rows[0]) throw new NotFoundException("Ese comentario ya no existe.");
      if (rows[0].usuario_id === null) throw new BadRequestException("Los comentarios de ELISUR no se reportan.");
      if (rows[0].usuario_id === usuarioId) throw new BadRequestException("No puedes reportar tu propio comentario.");
      const { rowCount } = await db.consultar(
        "INSERT INTO comentario_reportes (comentario_id, usuario_id, motivo) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [comentarioId, usuarioId, motivo],
      );
      if (rowCount) {
        await db.consultar(
          `UPDATE publicacion_comentarios SET reportes = reportes + 1,
             oculto = CASE WHEN reportes + 1 >= $2 AND NOT revisado THEN true ELSE oculto END
           WHERE id = $1`,
          [comentarioId, REPORTES_PARA_OCULTAR],
        );
      }
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

  /** Hasta cuándo queda destacada: los días cuentan desde que sale (ahora o la fecha programada). */
  private static destacadaHasta(dias: number, publicadoEn: Date | null): Date | null {
    if (dias <= 0) return null;
    return new Date(Math.max(Date.now(), publicadoEn?.getTime() ?? 0) + dias * 864e5);
  }

  async crear(dto: GuardarPublicacionDto, cuentaId: string): Promise<Publicacion> {
    const n = await this.normalizar(dto);
    const id = `pub-${randomUUID()}`;
    const programada = dto.estado === "publicada" && dto.programadaPara ? fechaProgramada(dto.programadaPara) : null;
    const publicadoEn = dto.estado === "publicada" ? programada ?? new Date() : null;
    await this.bd.consultar(
      `INSERT INTO publicaciones (id, tipo, texto, fotos, video_url, portada_url, enlace_url, enlace_titulo, enlace_miniatura,
                                  estado, permite_comentarios, destacada_hasta, creado_por, publicado_en)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, dto.tipo, n.texto, JSON.stringify(n.fotos), n.videoUrl, n.portadaUrl, n.enlace.url, n.enlace.titulo, n.enlace.miniatura,
       dto.estado, dto.permiteComentarios ?? false, ParaTiService.destacadaHasta(dto.diasDestacada ?? 0, publicadoEn), cuentaId, publicadoEn],
    );
    const accion = programada ? "programar" : dto.estado === "publicada" ? "publicar" : "crear";
    await this.auditoria.registrar(accion, "publicacion", id, cuentaId, { tipo: dto.tipo, ...(programada ? { para: programada.toISOString() } : {}) });
    return this.obtener(id);
  }

  async actualizar(id: string, dto: GuardarPublicacionDto, cuentaId: string): Promise<Publicacion> {
    const anterior = await this.obtener(id);
    const n = await this.normalizar(dto, anterior);
    // programadaPara: fecha = programar; null = publicar ya; sin enviar = no cambia la fecha.
    const programada = dto.estado === "publicada" && dto.programadaPara ? fechaProgramada(dto.programadaPara) : null;
    const publicadoEn =
      dto.estado !== "publicada"
        ? null
        : programada ?? (dto.programadaPara === null && anterior.programada ? new Date() : anterior.publicadoEn ? new Date(anterior.publicadoEn) : new Date());
    const tocaDestacada = dto.diasDestacada !== undefined;
    await this.bd.consultar(
      `UPDATE publicaciones SET
         tipo = $2, texto = $3, fotos = $4::jsonb, video_url = $5, portada_url = $6,
         enlace_url = $7, enlace_titulo = $8, enlace_miniatura = $9, estado = $10, permite_comentarios = $11,
         destacada_hasta = CASE WHEN $12::boolean THEN $13::timestamptz ELSE destacada_hasta END,
         destacada_orden = CASE WHEN $12::boolean AND $13::timestamptz IS NULL THEN NULL ELSE destacada_orden END,
         publicado_en = $14, actualizado_en = now()
       WHERE id = $1`,
      [id, dto.tipo, n.texto, JSON.stringify(n.fotos), n.videoUrl, n.portadaUrl, n.enlace.url, n.enlace.titulo, n.enlace.miniatura,
       dto.estado, dto.permiteComentarios ?? anterior.permiteComentarios, tocaDestacada,
       tocaDestacada ? ParaTiService.destacadaHasta(dto.diasDestacada ?? 0, publicadoEn) : null, publicadoEn],
    );
    // Archivos que dejó de usar (fotos quitadas, video reemplazado).
    const enUso = new Set([...n.fotos, n.videoUrl, n.portadaUrl]);
    for (const url of [...anterior.fotos, anterior.videoUrl, anterior.portadaUrl]) {
      if (url && !enUso.has(url)) await this.almacenamiento.eliminarPorUrl(url);
    }
    const accion = programada ? "programar" : anterior.estado !== "publicada" && dto.estado === "publicada" ? "publicar" : "actualizar";
    await this.auditoria.registrar(accion, "publicacion", id, cuentaId);
    return this.obtener(id);
  }

  async eliminar(id: string, cuentaId: string): Promise<void> {
    const p = await this.obtener(id);
    await this.bd.consultar("DELETE FROM publicaciones WHERE id = $1", [id]);
    for (const url of [...p.fotos, p.videoUrl, p.portadaUrl]) await this.almacenamiento.eliminarPorUrl(url);
    await this.auditoria.registrar("eliminar", "publicacion", id, cuentaId, { texto: p.texto.slice(0, 80) });
  }

  /** "Cerrar comentarios" desde la bandeja, sin abrir el editor. */
  async permitirComentarios(id: string, permite: boolean, cuentaId: string): Promise<Publicacion> {
    const { rowCount } = await this.bd.consultar("UPDATE publicaciones SET permite_comentarios = $2, actualizado_en = now() WHERE id = $1", [id, permite]);
    if (!rowCount) throw new NotFoundException("Esta publicación no existe o ya no está disponible.");
    await this.auditoria.registrar(permite ? "abrir_comentarios" : "cerrar_comentarios", "publicacion", id, cuentaId);
    return this.obtener(id);
  }

  /** Orden de las destacadas vigentes: el primero de la lista va primero en la app. */
  async ordenarDestacadas(ids: string[], cuentaId: string): Promise<Publicacion[]> {
    await this.bd.transaccion(async (db) => {
      for (const [i, id] of ids.entries()) {
        await db.consultar("UPDATE publicaciones SET destacada_orden = $2 WHERE id = $1 AND destacada_hasta > now()", [id, i]);
      }
    });
    await this.auditoria.registrar("ordenar_destacadas", "publicacion", ids[0] ?? "-", cuentaId, { ids });
    return this.destacadasVigentes(false);
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

  // ---------- Panel: números ----------

  /** Corazones, comentarios de vecinos, compartidos y visitantes: 7 días contra los 7 anteriores. */
  async resumen(): Promise<MetricaParaTi[]> {
    const dia = (col: string) => `(${col} AT TIME ZONE '${ZONA}')::date = d.dia`;
    const { rows } = await this.bd.consultar<{ corazones: string; comentarios: string; compartidos: string; visitantes: string }>(
      `WITH d AS (
         SELECT generate_series((now() AT TIME ZONE '${ZONA}')::date - 13, (now() AT TIME ZONE '${ZONA}')::date, interval '1 day')::date AS dia
       )
       SELECT d.dia,
         (SELECT COUNT(*) FROM publicacion_corazones x WHERE ${dia("x.creado_en")}) AS corazones,
         (SELECT COUNT(*) FROM publicacion_comentarios x WHERE x.usuario_id IS NOT NULL AND ${dia("x.creado_en")}) AS comentarios,
         (SELECT COUNT(*) FROM publicacion_compartidos x WHERE ${dia("x.creado_en")}) AS compartidos,
         (SELECT COUNT(*) FROM para_ti_visitas x WHERE x.dia = d.dia) AS visitantes
       FROM d ORDER BY d.dia`,
    );
    const { rows: unicos } = await this.bd.consultar<{ actual: string; anterior: string }>(
      `SELECT
         (SELECT COUNT(DISTINCT visitante) FROM para_ti_visitas WHERE dia > (now() AT TIME ZONE '${ZONA}')::date - 7) AS actual,
         (SELECT COUNT(DISTINCT visitante) FROM para_ti_visitas
            WHERE dia > (now() AT TIME ZONE '${ZONA}')::date - 14 AND dia <= (now() AT TIME ZONE '${ZONA}')::date - 7) AS anterior`,
    );
    const claves: MetricaParaTi["clave"][] = ["corazones", "comentarios", "compartidos", "visitantes"];
    return claves.map((clave) => {
      const valores = rows.map((r) => Number(r[clave]));
      const porDia = valores.slice(7);
      const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
      return clave === "visitantes"
        ? { clave, porDia, total: Number(unicos[0].actual), anterior: Number(unicos[0].anterior) }
        : { clave, porDia, total: suma(porDia), anterior: suma(valores.slice(0, 7)) };
    });
  }

  // ---------- Panel: comentarios ----------

  async comentariosAdmin(filtro: FiltroComentarios, q?: string): Promise<ComentarioPublicacion[]> {
    const busqueda = q?.trim().slice(0, 80) || null;
    const { rows } = await this.bd.consultar<FilaComentario>(
      `SELECT ${COLUMNAS_COMENTARIO_PANEL} ${DESDE_COMENTARIO_PANEL}
       WHERE ${FILTRO_COMENTARIOS[filtro]}
         AND ($1::text IS NULL OR c.texto ILIKE '%' || $1 || '%' OR u.nombre ILIKE '%' || $1 || '%' OR u.apellido ILIKE '%' || $1 || '%')
       ORDER BY ${filtro === "reportados" ? "c.reportes DESC," : ""} c.creado_en DESC LIMIT 300`,
      [busqueda],
    );
    return rows.map((f) => aComentario(f, true));
  }

  async resumenComentarios(): Promise<ResumenComentarios> {
    const cuenta = (filtro: FiltroComentarios) =>
      `(SELECT COUNT(*) FROM publicacion_comentarios c WHERE ${FILTRO_COMENTARIOS[filtro]}) AS ${filtro}`;
    const { rows } = await this.bd.consultar<Record<FiltroComentarios, string>>(
      `SELECT ${(["reportados", "todos", "ocultos", "sin_responder"] as FiltroComentarios[]).map(cuenta).join(", ")}`,
    );
    const r = rows[0];
    return { reportados: Number(r.reportados), todos: Number(r.todos), ocultos: Number(r.ocultos), sin_responder: Number(r.sin_responder) };
  }

  /** Todo el hilo de una publicación, con lo oculto, para ver el contexto en la bandeja. */
  async comentariosDePublicacionAdmin(publicacionId: string): Promise<ComentarioPublicacion[]> {
    const { rows } = await this.bd.consultar<FilaComentario>(
      `SELECT ${COLUMNAS_COMENTARIO_PANEL} ${DESDE_COMENTARIO_PANEL}
       WHERE c.publicacion_id = $1 ORDER BY c.creado_en ASC LIMIT 500`,
      [publicacionId],
    );
    return rows.map((f) => aComentario(f, true));
  }

  /** Comentario o respuesta oficial de ELISUR. `fijar` fija el hilo (el principal) arriba. */
  async comentarComoElisur(publicacionId: string, cuentaId: string, texto: string, respuestaA?: string, fijar = false): Promise<ComentarioPublicacion> {
    await this.obtener(publicacionId);
    const limpio = texto.trim();
    if (!limpio) throw new BadRequestException("Escribe algo antes de responder.");
    const hilo = await this.hiloDe(publicacionId, respuestaA);
    const comentarioId = `com-${randomUUID()}`;
    await this.bd.consultar(
      "INSERT INTO publicacion_comentarios (id, publicacion_id, cuenta_id, texto, respuesta_a) VALUES ($1, $2, $3, $4, $5)",
      [comentarioId, publicacionId, cuentaId, limpio, hilo],
    );
    await this.auditoria.registrar(hilo ? "responder" : "comentar", "comentario", comentarioId, cuentaId, { publicacionId });
    if (fijar) await this.fijarComentario(hilo ?? comentarioId, true, cuentaId);
    return this.leerComentario(comentarioId, true);
  }

  /** Un solo comentario fijado por publicación; fijar una respuesta fija su hilo. */
  async fijarComentario(comentarioId: string, fijado: boolean, cuentaId: string): Promise<void> {
    await this.bd.transaccion(async (db) => {
      const { rows } = await db.consultar<{ id: string; respuesta_a: string | null; publicacion_id: string }>(
        "SELECT id, respuesta_a, publicacion_id FROM publicacion_comentarios WHERE id = $1",
        [comentarioId],
      );
      if (!rows[0]) throw new NotFoundException("Ese comentario ya no existe.");
      const principal = rows[0].respuesta_a ?? rows[0].id;
      await db.consultar("UPDATE publicacion_comentarios SET fijado_en = NULL WHERE publicacion_id = $1", [rows[0].publicacion_id]);
      if (fijado) await db.consultar("UPDATE publicacion_comentarios SET fijado_en = now() WHERE id = $1", [principal]);
    });
    await this.auditoria.registrar(fijado ? "fijar" : "desfijar", "comentario", comentarioId, cuentaId);
  }

  /** "Ocultar", "Mantener oculto" (oculto + revisado) o "Está bien" (visible + revisado). */
  async moderarComentario(comentarioId: string, cambios: { oculto?: boolean; revisado?: boolean }, cuentaId: string): Promise<ComentarioPublicacion> {
    const { rowCount } = await this.bd.consultar(
      "UPDATE publicacion_comentarios SET oculto = COALESCE($2, oculto), revisado = COALESCE($3, revisado) WHERE id = $1",
      [comentarioId, cambios.oculto ?? null, cambios.revisado ?? null],
    );
    if (!rowCount) throw new NotFoundException("Ese comentario ya no existe.");
    const accion = cambios.oculto === true ? "ocultar" : cambios.oculto === false ? "mostrar" : "revisar";
    await this.auditoria.registrar(accion, "comentario", comentarioId, cuentaId, cambios);
    return this.leerComentario(comentarioId, true);
  }

  async eliminarComentario(comentarioId: string, cuentaId: string): Promise<void> {
    const { rowCount } = await this.bd.consultar("DELETE FROM publicacion_comentarios WHERE id = $1", [comentarioId]);
    if (!rowCount) throw new NotFoundException("Ese comentario ya no existe.");
    await this.auditoria.registrar("eliminar", "comentario", comentarioId, cuentaId);
  }

  /** El vecino no puede comentar en Para ti durante `dias` días (0 = quitar el silencio). */
  async silenciar(usuarioId: string, dias: number, cuentaId: string): Promise<{ hasta: string | null }> {
    const { rows } = await this.bd.consultar<{ id: string }>("SELECT id FROM usuarios_app WHERE id = $1", [usuarioId]);
    if (!rows[0]) throw new NotFoundException("Ese vecino ya no existe.");
    if (dias <= 0) {
      await this.bd.consultar("DELETE FROM para_ti_silenciados WHERE usuario_id = $1", [usuarioId]);
      await this.auditoria.registrar("quitar_silencio", "usuario", usuarioId, cuentaId);
      return { hasta: null };
    }
    const hasta = new Date(Date.now() + dias * 864e5);
    await this.bd.consultar(
      `INSERT INTO para_ti_silenciados (usuario_id, hasta, por) VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id) DO UPDATE SET hasta = $2, por = $3, creado_en = now()`,
      [usuarioId, hasta, cuentaId],
    );
    await this.auditoria.registrar("silenciar", "usuario", usuarioId, cuentaId, { dias });
    return { hasta: hasta.toISOString() };
  }
}
