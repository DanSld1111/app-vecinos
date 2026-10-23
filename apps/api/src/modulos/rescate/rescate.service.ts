import { randomUUID } from "crypto";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  ActividadRescate,
  Albergue,
  AlbergueResumen,
  AvisoMascota,
  AvisoMascotaConPistas,
  Cuenta,
  DatosAlbergue,
  InicioRescate,
  Mascota,
  MascotaConAlbergue,
  Padrinazgo,
  PistaAviso,
  SolicitudAdopcion,
  UsuarioApp,
} from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { NotificacionesPushService } from "../../comun/notificaciones-push/notificaciones-push.service";
import { dentroDelAlcance } from "../../comun/alcance";
import {
  ApadrinarDto,
  CrearAvisoDto,
  DatosAlbergueDto,
  GuardarMascotaDto,
  PistaDto,
  SolicitarAdopcionDto,
} from "./dto/rescate.dto";

/** Con estos reportes de vecinos distintos el aviso se oculta hasta que ELISUR lo revise. */
const REPORTES_PARA_OCULTAR = 3;
/** Un padrino activo sin pago en este tiempo figura como atrasado. */
const DIAS_ATRASO = 40;

/** Negocios cuya ficha efectiva es «mascotas»: los albergues. */
const ES_ALBERGUE = `EXISTS (
  SELECT 1 FROM negocio_categorias nc
  JOIN categorias c ON c.id = nc.categoria_id
  LEFT JOIN servicios_app s ON s.slug = c.servicio_slug
  WHERE nc.negocio_id = n.id AND COALESCE(c.ficha, s.ficha) = 'mascotas'
)`;

interface FilaMascota {
  id: string;
  negocio_id: string;
  nombre: string;
  especie: Mascota["especie"];
  sexo: Mascota["sexo"];
  edad_valor: number | null;
  edad_unidad: Mascota["edadUnidad"];
  tamano: Mascota["tamano"];
  peso_kg: string | null;
  foto_url: string | null;
  fotos: string[];
  personalidad: string[];
  salud: Mascota["salud"];
  convivencia: Mascota["convivencia"];
  historia: string;
  estado: Mascota["estado"];
  urgente: boolean;
  apadrinable: boolean;
  orden: number;
  creado_en: Date;
}

interface FilaAlbergue {
  id: string;
  nombre: string;
  foto_principal_url: string | null;
  whatsapp: string | null;
  direccion: string;
  datos_albergue: DatosAlbergue;
}

interface FilaSolicitud {
  id: string;
  numero: number;
  mascota_id: string;
  mascota_nombre: string;
  mascota_foto: string | null;
  negocio_id: string;
  albergue_nombre: string;
  albergue_whatsapp: string | null;
  nombre: string;
  telefono: string;
  respuestas: Record<string, string>;
  motivo: string;
  estado: SolicitudAdopcion["estado"];
  creado_en: Date;
  actualizado_en: Date;
}

interface FilaPadrinazgo {
  id: string;
  numero: number;
  mascota_id: string;
  mascota_nombre: string;
  mascota_foto: string | null;
  negocio_id: string;
  albergue_nombre: string;
  albergue_whatsapp: string | null;
  nombre: string;
  telefono: string;
  monto: string;
  estado: "por_confirmar" | "activo" | "cancelado";
  ultimo_pago_en: Date | null;
  creado_en: Date;
}

interface FilaAviso {
  id: string;
  comunidad_id: string;
  usuario_id: string;
  tipo: AvisoMascota["tipo"];
  especie: AvisoMascota["especie"];
  nombre: string;
  senas: string;
  tamano: AvisoMascota["tamano"];
  recompensa: string;
  fotos: string[];
  lugar: string;
  lat: number | null;
  lng: number | null;
  cuando: string;
  mostrar_whatsapp: boolean;
  telefono: string;
  autor_nombre: string;
  estado: AvisoMascota["estado"];
  reportes: number;
  pistas: number;
  cerrado_en: Date | null;
  vence_en: Date;
  creado_en: Date;
}

interface FilaPista {
  id: string;
  autor_nombre: string;
  cuando: string;
  lugar: string;
  lat: number | null;
  lng: number | null;
  texto: string;
  foto_url: string | null;
  es_mio: boolean;
  creado_en: Date;
}

const COLUMNAS_MASCOTA = `m.id, m.negocio_id, m.nombre, m.especie, m.sexo, m.edad_valor, m.edad_unidad, m.tamano, m.peso_kg,
  m.foto_url, m.fotos, m.personalidad, m.salud, m.convivencia, m.historia, m.estado, m.urgente, m.apadrinable, m.orden, m.creado_en`;

const COLUMNAS_SOLICITUD = `s.id, s.numero, s.mascota_id, m.nombre AS mascota_nombre, m.foto_url AS mascota_foto, s.negocio_id,
  n.nombre AS albergue_nombre, n.whatsapp AS albergue_whatsapp, s.nombre, s.telefono, s.respuestas, s.motivo, s.estado,
  s.creado_en, s.actualizado_en
  FROM solicitudes_adopcion s JOIN mascotas m ON m.id = s.mascota_id JOIN negocios n ON n.id = s.negocio_id`;

const COLUMNAS_PADRINAZGO = `p.id, p.numero, p.mascota_id, m.nombre AS mascota_nombre, m.foto_url AS mascota_foto, p.negocio_id,
  n.nombre AS albergue_nombre, n.whatsapp AS albergue_whatsapp, p.nombre, p.telefono, p.monto, p.estado, p.ultimo_pago_en,
  p.creado_en
  FROM padrinazgos p JOIN mascotas m ON m.id = p.mascota_id JOIN negocios n ON n.id = p.negocio_id`;

const COLUMNAS_AVISO = `a.id, a.comunidad_id, a.usuario_id, a.tipo, a.especie, a.nombre, a.senas, a.tamano, a.recompensa, a.fotos,
  a.lugar, a.lat, a.lng, a.cuando, a.mostrar_whatsapp, a.telefono, a.autor_nombre, a.estado, a.reportes, a.cerrado_en,
  a.vence_en, a.creado_en, (SELECT COUNT(*)::int FROM avisos_pistas p WHERE p.aviso_id = a.id) AS pistas
  FROM avisos_mascotas a`;

function aMascota(f: FilaMascota): Mascota {
  return {
    id: f.id,
    negocioId: f.negocio_id,
    nombre: f.nombre,
    especie: f.especie,
    sexo: f.sexo,
    edadValor: f.edad_valor,
    edadUnidad: f.edad_unidad,
    tamano: f.tamano,
    pesoKg: f.peso_kg === null ? null : Number(f.peso_kg),
    fotoUrl: f.foto_url,
    fotos: f.fotos ?? [],
    personalidad: f.personalidad ?? [],
    salud: f.salud ?? {},
    convivencia: f.convivencia ?? {},
    historia: f.historia,
    estado: f.estado,
    urgente: f.urgente,
    apadrinable: f.apadrinable,
    orden: f.orden,
    creadoEn: f.creado_en.toISOString(),
  };
}

function aAlbergueResumen(f: FilaAlbergue): AlbergueResumen {
  return { id: f.id, nombre: f.nombre, fotoPrincipalUrl: f.foto_principal_url, whatsapp: f.whatsapp, direccion: f.direccion };
}

function aSolicitud(f: FilaSolicitud): SolicitudAdopcion {
  return {
    id: f.id,
    numero: f.numero,
    mascotaId: f.mascota_id,
    mascotaNombre: f.mascota_nombre,
    mascotaFotoUrl: f.mascota_foto,
    negocioId: f.negocio_id,
    albergueNombre: f.albergue_nombre,
    albergueWhatsapp: f.albergue_whatsapp,
    nombre: f.nombre,
    telefono: f.telefono,
    respuestas: f.respuestas ?? {},
    motivo: f.motivo,
    estado: f.estado,
    creadoEn: f.creado_en.toISOString(),
    actualizadoEn: f.actualizado_en.toISOString(),
  };
}

function aPadrinazgo(f: FilaPadrinazgo): Padrinazgo {
  const desde = f.ultimo_pago_en ?? f.creado_en;
  const atrasado = f.estado === "activo" && Date.now() - desde.getTime() > DIAS_ATRASO * 86_400_000;
  return {
    id: f.id,
    numero: f.numero,
    mascotaId: f.mascota_id,
    mascotaNombre: f.mascota_nombre,
    mascotaFotoUrl: f.mascota_foto,
    negocioId: f.negocio_id,
    albergueNombre: f.albergue_nombre,
    albergueWhatsapp: f.albergue_whatsapp,
    nombre: f.nombre,
    telefono: f.telefono,
    monto: Number(f.monto),
    estado: atrasado ? "atrasado" : f.estado,
    ultimoPagoEn: f.ultimo_pago_en ? f.ultimo_pago_en.toISOString() : null,
    creadoEn: f.creado_en.toISOString(),
  };
}

/** `verTelefono`: el panel y quien lo publicó lo ven siempre; los vecinos, solo si se permitió. */
function aAviso(f: FilaAviso, usuarioId: string | null, verTelefono = false): AvisoMascota {
  const esMio = usuarioId !== null && f.usuario_id === usuarioId;
  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    tipo: f.tipo,
    especie: f.especie,
    nombre: f.nombre,
    senas: f.senas,
    tamano: f.tamano,
    recompensa: f.recompensa,
    fotos: f.fotos ?? [],
    lugar: f.lugar,
    lat: f.lat,
    lng: f.lng,
    cuando: f.cuando,
    autorNombre: f.autor_nombre,
    telefono: verTelefono || esMio || f.mostrar_whatsapp ? f.telefono || null : null,
    mostrarWhatsapp: f.mostrar_whatsapp,
    estado: f.estado,
    pistas: f.pistas,
    reportes: f.reportes,
    esMio,
    venceEn: f.vence_en.toISOString(),
    creadoEn: f.creado_en.toISOString(),
    cerradoEn: f.cerrado_en ? f.cerrado_en.toISOString() : null,
  };
}

function aPista(f: FilaPista): PistaAviso {
  return {
    id: f.id,
    autorNombre: f.autor_nombre,
    cuando: f.cuando,
    lugar: f.lugar,
    lat: f.lat,
    lng: f.lng,
    texto: f.texto,
    fotoUrl: f.foto_url,
    esMio: f.es_mio,
    creadoEn: f.creado_en.toISOString(),
  };
}

/** "Daniel P." — el nombre que se muestra a otros vecinos. */
function nombreCorto(u: UsuarioApp): string {
  const inicial = u.apellido?.trim() ? ` ${u.apellido.trim()[0].toUpperCase()}.` : "";
  return `${u.nombre.trim()}${inicial}`;
}

const nombreCompleto = (u: UsuarioApp) => `${u.nombre} ${u.apellido ?? ""}`.trim();

/**
 * Rescate animal (decisión 0097). Los albergues son negocios con la ficha «mascotas»; los avisos de
 * perdidos y encontrados los publican los vecinos y modera ELISUR.
 */
@Injectable()
export class RescateService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly almacenamiento: AlmacenamientoService,
    private readonly auditoria: AuditoriaService,
    private readonly push: NotificacionesPushService,
  ) {}

  // ─── Lo público ─────────────────────────────────────────────────────────────

  async inicio(comunidadId: string): Promise<InicioRescate> {
    const { rows: filasAlbergues } = await this.bd.consultar<FilaAlbergue & { en_adopcion: number }>(
      `SELECT n.id, n.nombre, n.foto_principal_url, n.whatsapp, n.direccion, n.datos_albergue,
              (SELECT COUNT(*)::int FROM mascotas m WHERE m.negocio_id = n.id AND m.estado <> 'adoptada') AS en_adopcion
       FROM negocios n
       WHERE n.comunidad_id = $1 AND n.estado = 'activo' AND n.archivado_en IS NULL AND ${ES_ALBERGUE}
       ORDER BY n.nombre`,
      [comunidadId],
    );
    const albergues: Albergue[] = filasAlbergues.map((f) => ({ ...aAlbergueResumen(f), datos: f.datos_albergue ?? {}, enAdopcion: f.en_adopcion }));
    const porId = new Map(filasAlbergues.map((f) => [f.id, aAlbergueResumen(f)]));
    const mascotas: MascotaConAlbergue[] = [];
    if (albergues.length) {
      const { rows } = await this.bd.consultar<FilaMascota>(
        `SELECT ${COLUMNAS_MASCOTA} FROM mascotas m
         WHERE m.negocio_id = ANY($1) AND m.estado <> 'adoptada'
         ORDER BY m.urgente DESC, m.orden, m.creado_en DESC
         LIMIT 300`,
        [albergues.map((a) => a.id)],
      );
      for (const f of rows) mascotas.push({ ...aMascota(f), albergue: porId.get(f.negocio_id)! });
    }
    return { mascotas, albergues, avisos: await this.listarAvisos(comunidadId, null) };
  }

  async mascota(id: string): Promise<MascotaConAlbergue & { datosAlbergue: DatosAlbergue }> {
    const { rows } = await this.bd.consultar<FilaMascota & FilaAlbergue & { albergue_nombre: string }>(
      `SELECT ${COLUMNAS_MASCOTA}, n.nombre AS albergue_nombre, n.foto_principal_url, n.whatsapp, n.direccion, n.datos_albergue
       FROM mascotas m JOIN negocios n ON n.id = m.negocio_id
       WHERE m.id = $1 AND n.estado = 'activo' AND n.archivado_en IS NULL`,
      [id],
    );
    const f = rows[0];
    if (!f) throw new NotFoundException("Esta mascota ya no está publicada.");
    return {
      ...aMascota(f),
      albergue: aAlbergueResumen({ ...f, id: f.negocio_id, nombre: f.albergue_nombre }),
      datosAlbergue: f.datos_albergue ?? {},
    };
  }

  /** Las mascotas de un albergue, para su ficha en la app. */
  async mascotasDeAlbergue(negocioId: string): Promise<Mascota[]> {
    const { rows } = await this.bd.consultar<FilaMascota>(
      `SELECT ${COLUMNAS_MASCOTA} FROM mascotas m JOIN negocios n ON n.id = m.negocio_id
       WHERE m.negocio_id = $1 AND m.estado <> 'adoptada' AND n.estado = 'activo'
       ORDER BY m.urgente DESC, m.orden, m.creado_en DESC`,
      [negocioId],
    );
    return rows.map(aMascota);
  }

  async listarAvisos(comunidadId: string, usuarioId: string | null): Promise<AvisoMascota[]> {
    const { rows } = await this.bd.consultar<FilaAviso>(
      `SELECT ${COLUMNAS_AVISO}
       WHERE a.comunidad_id = $1 AND a.estado = 'publicado' AND a.vence_en > now()
       ORDER BY a.creado_en DESC
       LIMIT 100`,
      [comunidadId],
    );
    return rows.map((f) => aAviso(f, usuarioId));
  }

  async aviso(id: string, usuarioId: string | null): Promise<AvisoMascotaConPistas> {
    const { rows } = await this.bd.consultar<FilaAviso>(`SELECT ${COLUMNAS_AVISO} WHERE a.id = $1`, [id]);
    const f = rows[0];
    // Un aviso oculto o cerrado solo lo sigue viendo quien lo publicó.
    if (!f || (f.estado !== "publicado" && f.usuario_id !== usuarioId)) throw new NotFoundException("Este aviso ya no está publicado.");
    const { rows: pistas } = await this.bd.consultar<FilaPista>(
      "SELECT id, autor_nombre, cuando, lugar, lat, lng, texto, foto_url, es_mio, creado_en FROM avisos_pistas WHERE aviso_id = $1 ORDER BY creado_en DESC",
      [id],
    );
    return { ...aAviso(f, usuarioId), listaPistas: pistas.map(aPista) };
  }

  // ─── Lo del vecino ──────────────────────────────────────────────────────────

  async solicitarAdopcion(mascotaId: string, usuario: UsuarioApp, dto: SolicitarAdopcionDto): Promise<SolicitudAdopcion> {
    const m = await this.mascota(mascotaId);
    if (m.estado === "adoptada") throw new BadRequestException(`${m.nombre} ya fue adoptada.`);
    const { rows: previa } = await this.bd.consultar<{ id: string }>(
      "SELECT id FROM solicitudes_adopcion WHERE mascota_id = $1 AND usuario_id = $2 AND estado IN ('nueva', 'entrevista', 'aprobada')",
      [mascotaId, usuario.id],
    );
    if (previa[0]) throw new BadRequestException(`Ya enviaste una solicitud por ${m.nombre}. Puedes verla en «Mi actividad».`);
    const respuestas = Object.fromEntries(
      Object.entries(dto.respuestas ?? {})
        .filter(([k, v]) => typeof v === "string" && k.length <= 20)
        .slice(0, 10)
        .map(([k, v]) => [k, v.slice(0, 80)]),
    );
    const id = `sol-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO solicitudes_adopcion (id, mascota_id, negocio_id, usuario_id, nombre, telefono, respuestas, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
      [id, mascotaId, m.negocioId, usuario.id, nombreCompleto(usuario), usuario.telefono ?? "", JSON.stringify(respuestas), dto.motivo?.trim() ?? ""],
    );
    return this.solicitud(id);
  }

  async cancelarSolicitud(id: string, usuario: UsuarioApp): Promise<SolicitudAdopcion> {
    const { rowCount } = await this.bd.consultar(
      "UPDATE solicitudes_adopcion SET estado = 'cancelada', actualizado_en = now() WHERE id = $1 AND usuario_id = $2 AND estado IN ('nueva', 'entrevista', 'aprobada')",
      [id, usuario.id],
    );
    if (!rowCount) throw new NotFoundException("No encontramos esa solicitud.");
    return this.solicitud(id);
  }

  async apadrinar(mascotaId: string, usuario: UsuarioApp, dto: ApadrinarDto): Promise<Padrinazgo> {
    const m = await this.mascota(mascotaId);
    if (!m.apadrinable) throw new BadRequestException(`${m.nombre} no recibe padrinos por ahora.`);
    const { rows: previo } = await this.bd.consultar<{ id: string }>(
      "SELECT id FROM padrinazgos WHERE mascota_id = $1 AND usuario_id = $2 AND estado <> 'cancelado'",
      [mascotaId, usuario.id],
    );
    // Si ya era padrino, "Ya pagué" de nuevo es el aporte del mes: vuelve a quedar por confirmar.
    if (previo[0]) {
      await this.bd.consultar("UPDATE padrinazgos SET monto = $2, estado = 'por_confirmar', actualizado_en = now() WHERE id = $1", [previo[0].id, dto.monto]);
      return this.padrinazgo(previo[0].id);
    }
    const id = `pad-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO padrinazgos (id, mascota_id, negocio_id, usuario_id, nombre, telefono, monto) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, mascotaId, m.negocioId, usuario.id, nombreCompleto(usuario), usuario.telefono ?? "", dto.monto],
    );
    return this.padrinazgo(id);
  }

  async cancelarPadrinazgo(id: string, usuario: UsuarioApp): Promise<Padrinazgo> {
    const { rowCount } = await this.bd.consultar(
      "UPDATE padrinazgos SET estado = 'cancelado', actualizado_en = now() WHERE id = $1 AND usuario_id = $2 AND estado <> 'cancelado'",
      [id, usuario.id],
    );
    if (!rowCount) throw new NotFoundException("No encontramos ese padrinazgo.");
    return this.padrinazgo(id);
  }

  async actividad(usuario: UsuarioApp): Promise<ActividadRescate> {
    const [solicitudes, padrinazgos, avisos] = await Promise.all([
      this.bd.consultar<FilaSolicitud>(`SELECT ${COLUMNAS_SOLICITUD} WHERE s.usuario_id = $1 ORDER BY s.creado_en DESC LIMIT 50`, [usuario.id]),
      this.bd.consultar<FilaPadrinazgo>(`SELECT ${COLUMNAS_PADRINAZGO} WHERE p.usuario_id = $1 ORDER BY p.creado_en DESC LIMIT 50`, [usuario.id]),
      this.bd.consultar<FilaAviso>(`SELECT ${COLUMNAS_AVISO} WHERE a.usuario_id = $1 ORDER BY a.creado_en DESC LIMIT 50`, [usuario.id]),
    ]);
    return {
      solicitudes: solicitudes.rows.map(aSolicitud),
      padrinazgos: padrinazgos.rows.map(aPadrinazgo),
      avisos: avisos.rows.map((f) => aAviso(f, usuario.id)),
    };
  }

  async subirFotoAviso(archivo: Express.Multer.File): Promise<{ url: string }> {
    return { url: await this.almacenamiento.subir("avisos-mascotas", archivo.buffer, archivo.originalname, archivo.mimetype) };
  }

  async crearAviso(usuario: UsuarioApp, dto: CrearAvisoDto): Promise<AvisoMascota> {
    if (!dto.fotos.length) throw new BadRequestException("Agrega al menos una foto.");
    if (!dto.lugar.trim()) throw new BadRequestException("Cuéntanos dónde fue.");
    const id = `avm-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO avisos_mascotas (id, comunidad_id, usuario_id, tipo, especie, nombre, senas, tamano, recompensa, fotos, lugar,
         lat, lng, cuando, mostrar_whatsapp, telefono, autor_nombre)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17)`,
      [
        id,
        usuario.comunidadId,
        usuario.id,
        dto.tipo,
        dto.especie,
        dto.nombre?.trim() ?? "",
        dto.senas.trim(),
        dto.tamano ?? null,
        dto.recompensa?.trim() ?? "",
        JSON.stringify(dto.fotos),
        dto.lugar.trim(),
        dto.lat ?? null,
        dto.lng ?? null,
        dto.cuando?.trim() ?? "",
        dto.mostrarWhatsapp,
        usuario.telefono ?? "",
        nombreCorto(usuario),
      ],
    );
    const titulo = dto.tipo === "perdido" ? `Se busca${dto.nombre?.trim() ? ` a ${dto.nombre.trim()}` : ""}` : "Mascota encontrada";
    void this.push.notificarComunidad(usuario.comunidadId, titulo, `${dto.lugar.trim()}. ¿La viste? Toca para ver el aviso.`);
    return (await this.aviso(id, usuario.id)) as AvisoMascota;
  }

  async cerrarAviso(id: string, usuario: UsuarioApp, abrir = false): Promise<AvisoMascota> {
    const { rowCount } = await this.bd.consultar(
      abrir
        ? "UPDATE avisos_mascotas SET estado = 'publicado', cerrado_en = NULL, vence_en = now() + interval '30 days', actualizado_en = now() WHERE id = $1 AND usuario_id = $2 AND estado = 'cerrado'"
        : "UPDATE avisos_mascotas SET estado = 'cerrado', cerrado_en = now(), actualizado_en = now() WHERE id = $1 AND usuario_id = $2 AND estado <> 'cerrado'",
      [id, usuario.id],
    );
    if (!rowCount) throw new NotFoundException("No encontramos ese aviso.");
    return this.aviso(id, usuario.id);
  }

  async agregarPista(avisoId: string, usuario: UsuarioApp, dto: PistaDto): Promise<PistaAviso> {
    const a = await this.aviso(avisoId, usuario.id);
    if (a.estado !== "publicado") throw new BadRequestException("Este aviso ya está cerrado.");
    const id = `pis-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO avisos_pistas (id, aviso_id, usuario_id, autor_nombre, cuando, lugar, lat, lng, texto, foto_url, es_mio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, avisoId, usuario.id, nombreCorto(usuario), dto.cuando?.trim() ?? "", dto.lugar?.trim() ?? "", dto.lat ?? null, dto.lng ?? null, dto.texto.trim(), dto.fotoUrl ?? null, dto.esMio ?? false],
    );
    const { rows } = await this.bd.consultar<FilaPista>(
      "SELECT id, autor_nombre, cuando, lugar, lat, lng, texto, foto_url, es_mio, creado_en FROM avisos_pistas WHERE id = $1",
      [id],
    );
    return aPista(rows[0]);
  }

  async reportarAviso(avisoId: string, usuario: UsuarioApp, motivo?: string): Promise<void> {
    await this.bd.transaccion(async (c) => {
      const { rowCount } = await c.consultar(
        "INSERT INTO avisos_reportes (aviso_id, usuario_id, motivo) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [avisoId, usuario.id, motivo?.trim() ?? ""],
      );
      if (!rowCount) return;
      await c.consultar(
        `UPDATE avisos_mascotas SET reportes = reportes + 1,
           estado = CASE WHEN reportes + 1 >= $2 AND estado = 'publicado' THEN 'oculto' ELSE estado END
         WHERE id = $1`,
        [avisoId, REPORTES_PARA_OCULTAR],
      );
    });
  }

  // ─── Panel del albergue ─────────────────────────────────────────────────────

  /** Mismo criterio que los productos del negocio: super admin, gestor (en sus distritos) y el dueño. */
  private async verificarAlbergue(cuenta: Cuenta, negocioId: string): Promise<void> {
    const { rows } = await this.bd.consultar<{ distrito_ubigeo: string }>("SELECT distrito_ubigeo FROM negocios WHERE id = $1", [negocioId]);
    if (!rows[0]) throw new NotFoundException("No existe ese albergue.");
    if (cuenta.rol === "super_admin") return;
    if (cuenta.rol === "gestor_negocios" && dentroDelAlcance(cuenta, rows[0].distrito_ubigeo)) return;
    if (cuenta.rol === "dueno_negocio" && cuenta.negocioIds.includes(negocioId)) return;
    throw new ForbiddenException("No administras este albergue.");
  }

  async mascotasAdmin(negocioId: string, cuenta: Cuenta): Promise<Mascota[]> {
    await this.verificarAlbergue(cuenta, negocioId);
    const { rows } = await this.bd.consultar<FilaMascota>(
      `SELECT ${COLUMNAS_MASCOTA} FROM mascotas m WHERE m.negocio_id = $1 ORDER BY (m.estado = 'adoptada'), m.orden, m.creado_en DESC`,
      [negocioId],
    );
    return rows.map(aMascota);
  }

  private valoresMascota(dto: GuardarMascotaDto) {
    return [
      dto.nombre.trim(),
      dto.especie,
      dto.sexo,
      dto.edadValor ?? null,
      dto.edadUnidad ?? "anios",
      dto.tamano,
      dto.pesoKg ?? null,
      dto.fotoUrl ?? null,
      JSON.stringify(dto.fotos ?? []),
      JSON.stringify((dto.personalidad ?? []).map((p) => p.trim()).filter(Boolean)),
      JSON.stringify(dto.salud ?? {}),
      JSON.stringify(dto.convivencia ?? {}),
      dto.historia?.trim() ?? "",
      dto.estado ?? "disponible",
      dto.urgente ?? false,
      dto.apadrinable ?? true,
    ];
  }

  async crearMascota(negocioId: string, dto: GuardarMascotaDto, cuenta: Cuenta): Promise<Mascota> {
    await this.verificarAlbergue(cuenta, negocioId);
    const id = `mas-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO mascotas (id, negocio_id, nombre, especie, sexo, edad_valor, edad_unidad, tamano, peso_kg, foto_url, fotos,
         personalidad, salud, convivencia, historia, estado, urgente, apadrinable, adoptada_en, orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16, $17, $18,
         CASE WHEN $16 = 'adoptada' THEN now() END, COALESCE((SELECT MAX(orden) + 1 FROM mascotas WHERE negocio_id = $2), 0))`,
      [id, negocioId, ...this.valoresMascota(dto)],
    );
    await this.auditoria.registrar("crear", "mascota", id, cuenta.id, { negocioId, nombre: dto.nombre });
    return this.mascotaAdmin(id);
  }

  async actualizarMascota(negocioId: string, id: string, dto: GuardarMascotaDto, cuenta: Cuenta): Promise<Mascota> {
    await this.verificarAlbergue(cuenta, negocioId);
    const { rowCount } = await this.bd.consultar(
      `UPDATE mascotas SET nombre = $3, especie = $4, sexo = $5, edad_valor = $6, edad_unidad = $7, tamano = $8, peso_kg = $9,
         foto_url = $10, fotos = $11::jsonb, personalidad = $12::jsonb, salud = $13::jsonb, convivencia = $14::jsonb, historia = $15,
         adoptada_en = CASE WHEN $16 = 'adoptada' AND estado <> 'adoptada' THEN now() WHEN $16 <> 'adoptada' THEN NULL ELSE adoptada_en END,
         estado = $16, urgente = $17, apadrinable = $18, actualizado_en = now()
       WHERE id = $1 AND negocio_id = $2`,
      [id, negocioId, ...this.valoresMascota(dto)],
    );
    if (!rowCount) throw new NotFoundException("No existe esa mascota.");
    await this.auditoria.registrar("actualizar", "mascota", id, cuenta.id, { negocioId, estado: dto.estado });
    return this.mascotaAdmin(id);
  }

  async eliminarMascota(negocioId: string, id: string, cuenta: Cuenta): Promise<void> {
    await this.verificarAlbergue(cuenta, negocioId);
    const { rowCount } = await this.bd.consultar("DELETE FROM mascotas WHERE id = $1 AND negocio_id = $2", [id, negocioId]);
    if (!rowCount) throw new NotFoundException("No existe esa mascota.");
    await this.auditoria.registrar("eliminar", "mascota", id, cuenta.id, { negocioId });
  }

  async ordenarMascotas(negocioId: string, ids: string[], cuenta: Cuenta): Promise<Mascota[]> {
    await this.verificarAlbergue(cuenta, negocioId);
    await this.bd.transaccion(async (c) => {
      for (let i = 0; i < ids.length; i++) await c.consultar("UPDATE mascotas SET orden = $3 WHERE id = $1 AND negocio_id = $2", [ids[i], negocioId, i]);
    });
    return this.mascotasAdmin(negocioId, cuenta);
  }

  async subirFotoMascota(negocioId: string, archivo: Express.Multer.File, cuenta: Cuenta): Promise<{ url: string }> {
    await this.verificarAlbergue(cuenta, negocioId);
    return { url: await this.almacenamiento.subir("mascotas", archivo.buffer, archivo.originalname, archivo.mimetype) };
  }

  async datosAlbergue(negocioId: string, cuenta: Cuenta): Promise<DatosAlbergue> {
    await this.verificarAlbergue(cuenta, negocioId);
    const { rows } = await this.bd.consultar<{ datos_albergue: DatosAlbergue }>("SELECT datos_albergue FROM negocios WHERE id = $1", [negocioId]);
    return rows[0]?.datos_albergue ?? {};
  }

  async guardarDatosAlbergue(negocioId: string, dto: DatosAlbergueDto, cuenta: Cuenta): Promise<DatosAlbergue> {
    await this.verificarAlbergue(cuenta, negocioId);
    const datos: DatosAlbergue = {
      yape: dto.yape?.trim() || undefined,
      titular: dto.titular?.trim() || undefined,
      montosPadrinazgo: dto.montosPadrinazgo?.length ? [...dto.montosPadrinazgo].sort((a, b) => a - b) : undefined,
      necesidades: (dto.necesidades ?? []).filter((n) => n.que.trim()).map((n) => ({ ...n, que: n.que.trim(), unidad: n.unidad.trim() })),
      turnos: (dto.turnos ?? []).filter((t) => t.que.trim()).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)),
      requisitos: dto.requisitos?.trim() || undefined,
    };
    await this.bd.consultar("UPDATE negocios SET datos_albergue = $2::jsonb WHERE id = $1", [negocioId, JSON.stringify(datos)]);
    await this.auditoria.registrar("actualizar", "albergue", negocioId, cuenta.id);
    return datos;
  }

  async solicitudesAdmin(negocioId: string, cuenta: Cuenta): Promise<SolicitudAdopcion[]> {
    await this.verificarAlbergue(cuenta, negocioId);
    const { rows } = await this.bd.consultar<FilaSolicitud>(
      `SELECT ${COLUMNAS_SOLICITUD} WHERE s.negocio_id = $1
       ORDER BY (s.estado IN ('nueva', 'entrevista', 'aprobada')) DESC, s.creado_en DESC LIMIT 300`,
      [negocioId],
    );
    return rows.map(aSolicitud);
  }

  /**
   * Al marcar «Adoptada», la mascota sale de la lista de adopción y las demás solicitudes abiertas
   * por ella se cierran como no aprobadas. «Entrevista» o «Aprobada» la dejan «En proceso».
   */
  async cambiarEstadoSolicitud(negocioId: string, id: string, estado: SolicitudAdopcion["estado"], cuenta: Cuenta): Promise<SolicitudAdopcion> {
    await this.verificarAlbergue(cuenta, negocioId);
    await this.bd.transaccion(async (c) => {
      const { rows } = await c.consultar<{ mascota_id: string }>(
        "UPDATE solicitudes_adopcion SET estado = $3, actualizado_en = now() WHERE id = $1 AND negocio_id = $2 RETURNING mascota_id",
        [id, negocioId, estado],
      );
      const mascotaId = rows[0]?.mascota_id;
      if (!mascotaId) throw new NotFoundException("No existe esa solicitud.");
      if (estado === "adoptada") {
        await c.consultar("UPDATE mascotas SET estado = 'adoptada', adoptada_en = now(), actualizado_en = now() WHERE id = $1", [mascotaId]);
        await c.consultar(
          "UPDATE solicitudes_adopcion SET estado = 'no_aprobada', actualizado_en = now() WHERE mascota_id = $1 AND id <> $2 AND estado IN ('nueva', 'entrevista', 'aprobada')",
          [mascotaId, id],
        );
      } else if (estado === "entrevista" || estado === "aprobada") {
        await c.consultar("UPDATE mascotas SET estado = 'en_proceso', actualizado_en = now() WHERE id = $1 AND estado = 'disponible'", [mascotaId]);
      }
    });
    await this.auditoria.registrar("estado_solicitud", "solicitud_adopcion", id, cuenta.id, { estado });
    return this.solicitud(id);
  }

  async padrinazgosAdmin(negocioId: string, cuenta: Cuenta): Promise<Padrinazgo[]> {
    await this.verificarAlbergue(cuenta, negocioId);
    const { rows } = await this.bd.consultar<FilaPadrinazgo>(
      `SELECT ${COLUMNAS_PADRINAZGO} WHERE p.negocio_id = $1 ORDER BY (p.estado = 'por_confirmar') DESC, (p.estado = 'cancelado'), p.creado_en DESC LIMIT 300`,
      [negocioId],
    );
    return rows.map(aPadrinazgo);
  }

  async accionPadrinazgo(negocioId: string, id: string, accion: "confirmar" | "cancelar", cuenta: Cuenta): Promise<Padrinazgo> {
    await this.verificarAlbergue(cuenta, negocioId);
    const { rowCount } = await this.bd.consultar(
      accion === "confirmar"
        ? "UPDATE padrinazgos SET estado = 'activo', ultimo_pago_en = now(), actualizado_en = now() WHERE id = $1 AND negocio_id = $2"
        : "UPDATE padrinazgos SET estado = 'cancelado', actualizado_en = now() WHERE id = $1 AND negocio_id = $2",
      [id, negocioId],
    );
    if (!rowCount) throw new NotFoundException("No existe ese padrinazgo.");
    await this.auditoria.registrar(accion === "confirmar" ? "confirmar_pago" : "cancelar", "padrinazgo", id, cuenta.id);
    return this.padrinazgo(id);
  }

  // ─── Panel de ELISUR: moderar avisos ────────────────────────────────────────

  async avisosAdmin(filtro: "todos" | "reportados" | "ocultos" | "cerrados"): Promise<AvisoMascota[]> {
    const donde =
      filtro === "reportados" ? "a.reportes > 0 AND a.estado <> 'cerrado'" : filtro === "ocultos" ? "a.estado = 'oculto'" : filtro === "cerrados" ? "a.estado = 'cerrado'" : "TRUE";
    const { rows } = await this.bd.consultar<FilaAviso>(`SELECT ${COLUMNAS_AVISO} WHERE ${donde} ORDER BY a.creado_en DESC LIMIT 300`);
    return rows.map((f) => aAviso(f, null, true));
  }

  async moderarAviso(id: string, estado: "publicado" | "oculto", cuenta: Cuenta): Promise<AvisoMascota> {
    const { rowCount } = await this.bd.consultar(
      "UPDATE avisos_mascotas SET estado = $2, actualizado_en = now() WHERE id = $1 AND estado <> 'cerrado'",
      [id, estado],
    );
    if (!rowCount) throw new NotFoundException("No existe ese aviso o ya está cerrado.");
    await this.auditoria.registrar(estado === "oculto" ? "ocultar" : "restaurar", "aviso_mascota", id, cuenta.id);
    const { rows } = await this.bd.consultar<FilaAviso>(`SELECT ${COLUMNAS_AVISO} WHERE a.id = $1`, [id]);
    return aAviso(rows[0], null, true);
  }

  async resumenAvisos(): Promise<{ reportados: number }> {
    const { rows } = await this.bd.consultar<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM avisos_mascotas WHERE reportes > 0 AND estado = 'oculto'",
    );
    return { reportados: rows[0].n };
  }

  // ─── Lecturas internas ──────────────────────────────────────────────────────

  private async mascotaAdmin(id: string): Promise<Mascota> {
    const { rows } = await this.bd.consultar<FilaMascota>(`SELECT ${COLUMNAS_MASCOTA} FROM mascotas m WHERE m.id = $1`, [id]);
    return aMascota(rows[0]);
  }

  private async solicitud(id: string): Promise<SolicitudAdopcion> {
    const { rows } = await this.bd.consultar<FilaSolicitud>(`SELECT ${COLUMNAS_SOLICITUD} WHERE s.id = $1`, [id]);
    return aSolicitud(rows[0]);
  }

  private async padrinazgo(id: string): Promise<Padrinazgo> {
    const { rows } = await this.bd.consultar<FilaPadrinazgo>(`SELECT ${COLUMNAS_PADRINAZGO} WHERE p.id = $1`, [id]);
    return aPadrinazgo(rows[0]);
  }
}
