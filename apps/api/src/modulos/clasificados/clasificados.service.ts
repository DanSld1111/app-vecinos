import { randomUUID } from "crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Clasificado, ClasificadoAdmin, ClasificadoPropio, Cuenta, DatosClasificado, UsuarioApp } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { NotificacionesPushService } from "../../comun/notificaciones-push/notificaciones-push.service";
import { EnviarClasificadoDto, GuardarClasificadoDto } from "./dto/clasificados.dto";

// Solo tipos desde @app-vecinos/tipos: en Render el paquete no se compila y un valor importado de
// ahí rompe el arranque (ERR_MODULE_NOT_FOUND). Mismo número que DIAS_VIGENCIA_CLASIFICADO.
const DIAS_VIGENCIA_CLASIFICADO = 30;
/** Con estos reportes de vecinos distintos el aviso vuelve a revisión. */
const REPORTES_PARA_REVISAR = 3;
/** Avisos «por vencer»: los que vencen en esta cantidad de días. */
const DIAS_POR_VENCER = 5;

/** Qué subtipos acepta cada sección. */
const SUBTIPOS_DE: Record<string, string[]> = {
  inmuebles: ["alquiler", "venta"],
  mascotas: ["perdido", "encontrado", "adopcion"],
  turismo: ["full_day", "varios_dias", "playa", "aventura"],
};

export type BandejaClasificados = "revisar" | "publicados" | "por_vencer" | "cerrados";

interface FilaClasificado {
  id: string;
  comunidad_id: string;
  seccion: Clasificado["seccion"];
  subtipo: Clasificado["subtipo"];
  titulo: string;
  texto: string;
  texto_original: string;
  fotos: string[];
  referencia: string;
  datos: DatosClasificado;
  contacto_nombre: string;
  contacto_rol: string;
  contacto_whatsapp: string;
  contacto_telefono: string;
  autoriza_contacto: boolean;
  usuario_id: string | null;
  estado: Clasificado["estado"];
  cierre: Clasificado["cierre"];
  motivo_rechazo: string | null;
  reportes: number;
  vistas: number;
  contactos: number;
  publicado_en: Date | null;
  vence_en: Date | null;
  creado_en: Date;
}

const COLUMNAS = `c.id, c.comunidad_id, c.seccion, c.subtipo, c.titulo, c.texto, c.texto_original, c.fotos, c.referencia,
  c.datos, c.contacto_nombre, c.contacto_rol, c.contacto_whatsapp, c.contacto_telefono, c.autoriza_contacto, c.usuario_id,
  c.estado, c.cierre, c.motivo_rechazo, c.reportes, c.vistas, c.contactos, c.publicado_en, c.vence_en, c.creado_en`;

/** Visible para todos: publicado y sin vencer. */
const VIGENTE = "c.estado = 'publicado' AND c.vence_en > now()";

function aPublico(f: FilaClasificado): Clasificado {
  // Si el vecino no autorizó mostrar su número, el aviso no lleva contacto directo.
  const mostrar = f.autoriza_contacto || f.usuario_id === null;
  return {
    id: f.id,
    comunidadId: f.comunidad_id,
    seccion: f.seccion,
    subtipo: f.subtipo,
    titulo: f.titulo,
    texto: f.texto,
    fotos: f.fotos ?? [],
    referencia: f.referencia,
    datos: f.datos ?? {},
    contactoNombre: f.contacto_nombre,
    contactoRol: f.contacto_rol,
    contactoWhatsapp: mostrar ? f.contacto_whatsapp : "",
    contactoTelefono: mostrar ? f.contacto_telefono : "",
    estado: f.estado,
    cierre: f.cierre,
    publicadoEn: f.publicado_en?.toISOString() ?? null,
    venceEn: f.vence_en?.toISOString() ?? null,
    vistas: f.vistas,
    contactos: f.contactos,
    creadoEn: f.creado_en.toISOString(),
  };
}

function aAdmin(f: FilaClasificado): ClasificadoAdmin {
  return {
    ...aPublico(f),
    contactoWhatsapp: f.contacto_whatsapp,
    contactoTelefono: f.contacto_telefono,
    textoOriginal: f.texto_original,
    autorizaContacto: f.autoriza_contacto,
    usuarioId: f.usuario_id,
    motivoRechazo: f.motivo_rechazo,
    reportes: f.reportes,
  };
}

const numero = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const texto = (v: unknown, max = 120): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const uno = <T extends string>(v: unknown, opciones: readonly T[]): T | undefined => (opciones.includes(v as T) ? (v as T) : undefined);

/** Solo las claves conocidas y con el tipo correcto: el cuerpo llega como objeto libre. */
function limpiarDatos(d: Record<string, unknown> = {}): DatosClasificado {
  const datos: DatosClasificado = {
    tipoInmueble: uno(d.tipoInmueble, ["departamento", "casa", "habitacion", "oficina", "local", "terreno"] as const),
    precio: numero(d.precio),
    moneda: uno(d.moneda, ["PEN", "USD"] as const),
    mantenimiento: numero(d.mantenimiento),
    area: numero(d.area),
    dormitorios: numero(d.dormitorios),
    banos: numero(d.banos),
    cocheras: numero(d.cocheras),
    amoblado: typeof d.amoblado === "boolean" ? d.amoblado : undefined,
    aceptaMascotas: typeof d.aceptaMascotas === "boolean" ? d.aceptaMascotas : undefined,
    especie: uno(d.especie, ["perro", "gato", "otro"] as const),
    nombreMascota: texto(d.nombreMascota, 40),
    lugar: texto(d.lugar),
    cuando: texto(d.cuando, 60),
    destino: texto(d.destino),
    duracion: texto(d.duracion, 60),
    salidas: Array.isArray(d.salidas) ? d.salidas.filter((s): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)).slice(0, 20) : undefined,
    precioPersona: numero(d.precioPersona),
    incluye: Array.isArray(d.incluye) ? d.incluye.map((s) => texto(s, 60)).filter((s): s is string => Boolean(s)).slice(0, 20) : undefined,
  };
  // Sin claves vacías: el JSON guardado queda limpio.
  return Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== undefined && v !== null)) as DatosClasificado;
}

function validarSubtipo(seccion: string, subtipo: string): void {
  if (!SUBTIPOS_DE[seccion]?.includes(subtipo)) throw new BadRequestException("Ese tipo de aviso no corresponde a la sección.");
}

const nombreCorto = (u: UsuarioApp) => `${u.nombre.trim()}${u.apellido?.trim() ? ` ${u.apellido.trim()[0].toUpperCase()}.` : ""}`;

const ROL_VECINO: Record<string, string> = { inmuebles: "propietario", mascotas: "vecino", turismo: "organizador" };

/**
 * Avisos de la comunidad (decisión 0098). Los vecinos envían, el equipo de ELISUR revisa y publica;
 * el contacto es del anunciante. Se llaman «clasificados» para no chocar con los avisos de Comunidad.
 */
@Injectable()
export class ClasificadosService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly almacenamiento: AlmacenamientoService,
    private readonly auditoria: AuditoriaService,
    private readonly push: NotificacionesPushService,
  ) {}

  // ─── Lo público ─────────────────────────────────────────────────────────────

  async listar(filtro: { comunidadId: string; seccion?: string; subtipo?: string; tipo?: string; q?: string; limite?: number }): Promise<Clasificado[]> {
    const condiciones = ["c.comunidad_id = $1", VIGENTE];
    const valores: unknown[] = [filtro.comunidadId];
    const agregar = (sql: string, valor: unknown) => {
      valores.push(valor);
      condiciones.push(sql.replace(/\?/g, `$${valores.length}`));
    };
    if (filtro.seccion) agregar("c.seccion = ?", filtro.seccion);
    if (filtro.subtipo) agregar("c.subtipo = ?", filtro.subtipo);
    // «tipo» es el tipo de inmueble o la especie, según la sección.
    if (filtro.tipo) agregar("(c.datos->>'tipoInmueble' = ? OR c.datos->>'especie' = ?)", filtro.tipo);
    if (filtro.q?.trim()) agregar("(c.titulo || ' ' || c.texto || ' ' || c.referencia) ILIKE ?", `%${filtro.q.trim()}%`);
    const limite = Math.min(Math.max(filtro.limite ?? 60, 1), 100);
    const { rows } = await this.bd.consultar<FilaClasificado>(
      `SELECT ${COLUMNAS} FROM clasificados c WHERE ${condiciones.join(" AND ")} ORDER BY c.publicado_en DESC LIMIT ${limite}`,
      valores,
    );
    return rows.map(aPublico);
  }

  /** Abrir la ficha suma una vista. */
  async ver(id: string): Promise<Clasificado> {
    const { rows } = await this.bd.consultar<FilaClasificado>(
      `UPDATE clasificados c SET vistas = vistas + 1 WHERE c.id = $1 AND ${VIGENTE} RETURNING ${COLUMNAS}`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException("Este aviso ya no está disponible.");
    return aPublico(rows[0]);
  }

  /** Alguien tocó WhatsApp o Llamar: el vecino lo ve en «Mis avisos». */
  async contacto(id: string): Promise<void> {
    await this.bd.consultar(`UPDATE clasificados c SET contactos = contactos + 1 WHERE c.id = $1 AND ${VIGENTE}`, [id]);
  }

  // ─── El vecino ──────────────────────────────────────────────────────────────

  async subirFoto(archivo: Express.Multer.File): Promise<{ url: string }> {
    return { url: await this.almacenamiento.subir("clasificados", archivo.buffer, archivo.originalname, archivo.mimetype) };
  }

  async enviar(usuario: UsuarioApp, dto: EnviarClasificadoDto): Promise<ClasificadoPropio> {
    validarSubtipo(dto.seccion, dto.subtipo);
    if (!dto.fotos.length) throw new BadRequestException("Agrega al menos una foto.");
    if (dto.texto.trim().length < 10) throw new BadRequestException("Cuéntanos un poco más del aviso.");
    const whatsapp = dto.whatsapp.replace(/\D/g, "");
    if (whatsapp.length < 9) throw new BadRequestException("Revisa tu número de WhatsApp.");
    const id = `cla-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO clasificados (id, comunidad_id, seccion, subtipo, texto_original, texto, fotos, datos,
         contacto_nombre, contacto_rol, contacto_whatsapp, autoriza_contacto, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12)`,
      [
        id,
        usuario.comunidadId,
        dto.seccion,
        dto.subtipo,
        dto.texto.trim(),
        JSON.stringify(dto.fotos),
        JSON.stringify(limpiarDatos(dto.datos)),
        nombreCorto(usuario),
        ROL_VECINO[dto.seccion],
        whatsapp,
        dto.autorizaContacto,
        usuario.id,
      ],
    );
    return this.propio(id, usuario.id);
  }

  async mios(usuario: UsuarioApp): Promise<ClasificadoPropio[]> {
    const { rows } = await this.bd.consultar<FilaClasificado>(
      `SELECT ${COLUMNAS} FROM clasificados c WHERE c.usuario_id = $1 ORDER BY c.creado_en DESC LIMIT 50`,
      [usuario.id],
    );
    return rows.map((f) => ({ ...aPublico(f), contactoWhatsapp: f.contacto_whatsapp, motivoRechazo: f.motivo_rechazo }));
  }

  /** Otros 30 días desde hoy. Sirve también para un aviso ya vencido. */
  async renovar(id: string, usuario: UsuarioApp): Promise<ClasificadoPropio> {
    const { rowCount } = await this.bd.consultar(
      `UPDATE clasificados SET vence_en = now() + interval '${DIAS_VIGENCIA_CLASIFICADO} days', actualizado_en = now()
        WHERE id = $1 AND usuario_id = $2 AND estado = 'publicado'`,
      [id, usuario.id],
    );
    if (!rowCount) throw new NotFoundException("Solo se renueva un aviso publicado.");
    return this.propio(id, usuario.id);
  }

  async cerrarPropio(id: string, usuario: UsuarioApp, cierre: string): Promise<ClasificadoPropio> {
    const { rowCount } = await this.bd.consultar(
      `UPDATE clasificados SET estado = 'cerrado', cierre = $3, cerrado_en = now(), actualizado_en = now()
        WHERE id = $1 AND usuario_id = $2 AND estado IN ('pendiente', 'publicado')`,
      [id, usuario.id, cierre],
    );
    if (!rowCount) throw new NotFoundException("No encontramos ese aviso.");
    return this.propio(id, usuario.id);
  }

  async reportar(id: string, usuario: UsuarioApp, motivo?: string): Promise<void> {
    await this.bd.transaccion(async (c) => {
      const { rowCount } = await c.consultar(
        "INSERT INTO clasificados_reportes (clasificado_id, usuario_id, motivo) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [id, usuario.id, motivo?.trim() ?? ""],
      );
      if (!rowCount) return;
      await c.consultar(
        `UPDATE clasificados SET reportes = reportes + 1,
           estado = CASE WHEN reportes + 1 >= $2 AND estado = 'publicado' THEN 'pendiente' ELSE estado END
         WHERE id = $1`,
        [id, REPORTES_PARA_REVISAR],
      );
    });
  }

  private async propio(id: string, usuarioId: string): Promise<ClasificadoPropio> {
    const { rows } = await this.bd.consultar<FilaClasificado>(`SELECT ${COLUMNAS} FROM clasificados c WHERE c.id = $1 AND c.usuario_id = $2`, [id, usuarioId]);
    if (!rows[0]) throw new NotFoundException("No encontramos ese aviso.");
    return { ...aPublico(rows[0]), contactoWhatsapp: rows[0].contacto_whatsapp, motivoRechazo: rows[0].motivo_rechazo };
  }

  // ─── El equipo de ELISUR (panel) ────────────────────────────────────────────

  async bandeja(bandeja: BandejaClasificados, seccion?: string): Promise<ClasificadoAdmin[]> {
    const donde = {
      revisar: "c.estado = 'pendiente'",
      publicados: VIGENTE,
      por_vencer: `${VIGENTE} AND c.vence_en < now() + interval '${DIAS_POR_VENCER} days'`,
      cerrados: "(c.estado IN ('cerrado', 'rechazado') OR (c.estado = 'publicado' AND c.vence_en <= now()))",
    }[bandeja];
    const valores: unknown[] = [];
    let extra = "";
    if (seccion) {
      valores.push(seccion);
      extra = " AND c.seccion = $1";
    }
    const orden = bandeja === "revisar" ? "c.creado_en ASC" : bandeja === "por_vencer" ? "c.vence_en ASC" : "COALESCE(c.publicado_en, c.creado_en) DESC";
    const { rows } = await this.bd.consultar<FilaClasificado>(`SELECT ${COLUMNAS} FROM clasificados c WHERE ${donde}${extra} ORDER BY ${orden} LIMIT 300`, valores);
    return rows.map(aAdmin);
  }

  async resumen(): Promise<Record<BandejaClasificados, number>> {
    const { rows } = await this.bd.consultar<Record<BandejaClasificados, number>>(
      `SELECT
         COUNT(*) FILTER (WHERE c.estado = 'pendiente')::int AS revisar,
         COUNT(*) FILTER (WHERE ${VIGENTE})::int AS publicados,
         COUNT(*) FILTER (WHERE ${VIGENTE} AND c.vence_en < now() + interval '${DIAS_POR_VENCER} days')::int AS por_vencer,
         COUNT(*) FILTER (WHERE c.estado IN ('cerrado', 'rechazado') OR (c.estado = 'publicado' AND c.vence_en <= now()))::int AS cerrados
       FROM clasificados c`,
    );
    return rows[0];
  }

  async detalleAdmin(id: string): Promise<ClasificadoAdmin> {
    const { rows } = await this.bd.consultar<FilaClasificado>(`SELECT ${COLUMNAS} FROM clasificados c WHERE c.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException("No existe ese aviso.");
    return aAdmin(rows[0]);
  }

  async subirFotoAdmin(archivo: Express.Multer.File): Promise<{ url: string }> {
    return this.subirFoto(archivo);
  }

  /** Cargado a mano por el equipo (lo envió alguien por otro medio): se publica de una vez. */
  async crearAdmin(dto: GuardarClasificadoDto, cuenta: Cuenta): Promise<ClasificadoAdmin> {
    validarSubtipo(dto.seccion, dto.subtipo);
    if (!dto.comunidadId) throw new BadRequestException("Elige la comunidad donde se publica.");
    const id = `cla-${randomUUID()}`;
    await this.bd.consultar(
      `INSERT INTO clasificados (id, comunidad_id, seccion, subtipo, autoriza_contacto, estado) VALUES ($1, $2, $3, $4, true, 'pendiente')`,
      [id, dto.comunidadId, dto.seccion, dto.subtipo],
    );
    await this.guardar(id, dto, cuenta);
    return this.publicar(id, cuenta);
  }

  async guardar(id: string, dto: GuardarClasificadoDto, cuenta: Cuenta): Promise<ClasificadoAdmin> {
    validarSubtipo(dto.seccion, dto.subtipo);
    const { rowCount } = await this.bd.consultar(
      `UPDATE clasificados SET seccion = $2, subtipo = $3, titulo = $4, texto = $5, fotos = $6::jsonb, referencia = $7,
         datos = $8::jsonb, contacto_nombre = $9, contacto_rol = $10, contacto_whatsapp = $11, contacto_telefono = $12,
         revisado_por_cuenta_id = $13, actualizado_en = now()
       WHERE id = $1`,
      [
        id,
        dto.seccion,
        dto.subtipo,
        dto.titulo.trim(),
        dto.texto.trim(),
        JSON.stringify(dto.fotos),
        dto.referencia.trim(),
        JSON.stringify(limpiarDatos(dto.datos)),
        dto.contactoNombre.trim(),
        dto.contactoRol.trim(),
        dto.contactoWhatsapp.replace(/\D/g, ""),
        dto.contactoTelefono.replace(/\D/g, ""),
        cuenta.id,
      ],
    );
    if (!rowCount) throw new NotFoundException("No existe ese aviso.");
    return this.detalleAdmin(id);
  }

  async publicar(id: string, cuenta: Cuenta): Promise<ClasificadoAdmin> {
    const actual = await this.detalleAdmin(id);
    if (!actual.titulo.trim()) throw new BadRequestException("Ponle un título antes de publicar.");
    if (!actual.fotos.length) throw new BadRequestException("El aviso necesita al menos una foto.");
    if (!actual.contactoWhatsapp && !actual.contactoTelefono) throw new BadRequestException("Falta el contacto del anunciante.");
    const primeraVez = actual.publicadoEn === null;
    await this.bd.consultar(
      `UPDATE clasificados SET estado = 'publicado', motivo_rechazo = NULL, reportes = 0, revisado_por_cuenta_id = $2,
         publicado_en = COALESCE(publicado_en, now()), vence_en = now() + interval '${DIAS_VIGENCIA_CLASIFICADO} days', actualizado_en = now()
       WHERE id = $1`,
      [id, cuenta.id],
    );
    await this.auditoria.registrar("publicar", "clasificado", id, cuenta.id);
    if (primeraVez && actual.subtipo === "perdido") {
      const nombre = actual.datos.nombreMascota ? ` a ${actual.datos.nombreMascota}` : "";
      void this.push.notificarComunidad(actual.comunidadId, `Se busca${nombre}`, `${actual.datos.lugar ?? actual.referencia}. ¿Lo viste? Toca para ver el aviso.`);
    }
    return this.detalleAdmin(id);
  }

  async rechazar(id: string, motivo: string, cuenta: Cuenta): Promise<ClasificadoAdmin> {
    const { rowCount } = await this.bd.consultar(
      `UPDATE clasificados SET estado = 'rechazado', motivo_rechazo = $2, revisado_por_cuenta_id = $3, actualizado_en = now()
        WHERE id = $1 AND estado IN ('pendiente', 'publicado')`,
      [id, motivo.trim(), cuenta.id],
    );
    if (!rowCount) throw new NotFoundException("No existe ese aviso o ya está cerrado.");
    await this.auditoria.registrar("rechazar", "clasificado", id, cuenta.id, { motivo });
    return this.detalleAdmin(id);
  }

  async cerrarAdmin(id: string, cierre: string, cuenta: Cuenta): Promise<ClasificadoAdmin> {
    const { rowCount } = await this.bd.consultar(
      `UPDATE clasificados SET estado = 'cerrado', cierre = $2, cerrado_en = now(), actualizado_en = now()
        WHERE id = $1 AND estado <> 'cerrado'`,
      [id, cierre],
    );
    if (!rowCount) throw new NotFoundException("No existe ese aviso o ya está cerrado.");
    await this.auditoria.registrar("cerrar", "clasificado", id, cuenta.id, { cierre });
    return this.detalleAdmin(id);
  }
}
