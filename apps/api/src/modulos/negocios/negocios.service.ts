import { randomUUID } from "crypto";
import { join } from "path";
import { unlink } from "fs/promises";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Cuenta, Negocio, OfertaNegocio, Producto, ResultadoPaginado } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { codificarCursor, decodificarCursor } from "../../comun/paginacion";
import { dentroDelAlcance } from "../../comun/alcance";
import { BusquedaService } from "../busqueda/busqueda.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { COLUMNAS_NEGOCIO, FilaNegocio, aNegocio } from "./negocios.mapeo";
import { FilaProducto, aProducto } from "./productos.mapeo";
import { DIRECTORIO_FOTOS_NEGOCIO } from "./foto-negocio.config";
import { DIRECTORIO_FOTOS_PRODUCTO } from "./foto-producto.config";
import { ListarNegociosDto } from "./dto/listar-negocios.dto";
import { CrearNegocioDto } from "./dto/crear-negocio.dto";
import { ActualizarInfoNegocioDto } from "./dto/actualizar-info-negocio.dto";
import { ActualizarHorariosDto } from "./dto/actualizar-horarios.dto";
import { AgregarOfertaDto } from "./dto/agregar-oferta.dto";

const HORARIO_SEMANA_CERRADA = {
  lunes: { cerrado: true },
  martes: { cerrado: true },
  miercoles: { cerrado: true },
  jueves: { cerrado: true },
  viernes: { cerrado: true },
  sabado: { cerrado: true },
  domingo: { cerrado: true },
};

@Injectable()
export class NegociosService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly busqueda: BusquedaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * Búsqueda con tolerancia a errores de tipeo y relevancia (Meilisearch) — usada por la barra
   * de búsqueda de la app (antes solo tenía `ILIKE` vía el parámetro `busqueda` de `listar()`,
   * que sigue existiendo tal cual para no romper nada). Si el índice no está disponible, cae de
   * vuelta al mismo `ILIKE` como respaldo — ver docs/decisiones/0018-indice-de-busqueda.md.
   */
  async buscar(query: string, comunidadId: string, limite: number): Promise<Negocio[]> {
    const ids = await this.busqueda.buscarNegocios(query, comunidadId, limite);

    if (ids === null) {
      // Índice no disponible: mismo comportamiento de antes.
      const { rows } = await this.bd.consultar<FilaNegocio>(
        `SELECT ${COLUMNAS_NEGOCIO}
         FROM negocios n
         LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
         WHERE n.comunidad_id = $1 AND n.estado = 'activo' AND n.nombre ILIKE $2
         GROUP BY n.id
         ORDER BY n.nombre
         LIMIT $3`,
        [comunidadId, `%${query}%`, limite],
      );
      return rows.map(aNegocio);
    }

    if (ids.length === 0) return [];

    const { rows } = await this.bd.consultar<FilaNegocio>(
      `SELECT ${COLUMNAS_NEGOCIO}
       FROM negocios n
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE n.id = ANY($1) AND n.estado = 'activo'
       GROUP BY n.id`,
      [ids],
    );
    const porId = new Map(rows.map((fila) => [fila.id, aNegocio(fila)]));
    // Se reordena según la relevancia que devolvió el índice — el SELECT de arriba no la conserva.
    return ids.map((id) => porId.get(id)).filter((negocio): negocio is Negocio => Boolean(negocio));
  }

  /**
   * Solo negocios 'activo': esta es la lectura pública que consume la app del vecino.
   * Un negocio 'por_verificar' o 'inactivo' es contenido en tránsito del panel admin,
   * nunca algo que un vecino real deba ver — no es un filtro más, es una regla fija.
   */
  async listar(filtro: ListarNegociosDto): Promise<ResultadoPaginado<Negocio>> {
    const condiciones: string[] = ["n.comunidad_id = $1", "n.estado = 'activo'"];
    const valores: unknown[] = [filtro.comunidadId];

    if (filtro.categoriaId) {
      valores.push(filtro.categoriaId);
      condiciones.push(
        `EXISTS (SELECT 1 FROM negocio_categorias x WHERE x.negocio_id = n.id AND x.categoria_id = $${valores.length})`,
      );
    }

    if (filtro.busqueda) {
      valores.push(`%${filtro.busqueda}%`);
      condiciones.push(`n.nombre ILIKE $${valores.length}`);
    }

    const cursor = decodificarCursor(filtro.cursor);
    if (cursor) {
      valores.push(cursor.creadoEn, cursor.id);
      condiciones.push(`(n.creado_en, n.id) < ($${valores.length - 1}, $${valores.length})`);
    }

    const limite = filtro.limite ?? 20;
    valores.push(limite + 1);

    const { rows } = await this.bd.consultar<FilaNegocio>(
      `SELECT ${COLUMNAS_NEGOCIO}
       FROM negocios n
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE ${condiciones.join(" AND ")}
       GROUP BY n.id
       ORDER BY n.creado_en DESC, n.id DESC
       LIMIT $${valores.length}`,
      valores,
    );

    const hayMas = rows.length > limite;
    const items = rows.slice(0, limite).map(aNegocio);
    const ultimo = items[items.length - 1];
    const cursorSiguiente = hayMas && ultimo ? codificarCursor({ creadoEn: ultimo.creadoEn, id: ultimo.id }) : null;

    return { items, cursorSiguiente };
  }

  async obtenerPorId(id: string): Promise<Negocio | null> {
    const { rows } = await this.bd.consultar<FilaNegocio>(
      `SELECT ${COLUMNAS_NEGOCIO}
       FROM negocios n
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE n.id = $1 AND n.estado = 'activo'
       GROUP BY n.id`,
      [id],
    );
    const fila = rows[0];
    return fila ? aNegocio(fila) : null;
  }

  /**
   * Sin filtrar por estado del negocio: si alguien pide el menú de un id inexistente o
   * inactivo, simplemente no hay filas — no hace falta una segunda consulta para saberlo.
   */
  async listarProductos(negocioId: string): Promise<Producto[]> {
    const { rows } = await this.bd.consultar<FilaProducto>(
      `SELECT id, negocio_id, nombre, descripcion, precio, categoria_menu, destacado, foto_url
       FROM productos
       WHERE negocio_id = $1
       ORDER BY categoria_menu, nombre`,
      [negocioId],
    );
    return rows.map(aProducto);
  }

  private async obtenerFilaAdminOFallar(id: string): Promise<FilaNegocio> {
    const { rows } = await this.bd.consultar<FilaNegocio>(
      `SELECT ${COLUMNAS_NEGOCIO}
       FROM negocios n
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE n.id = $1
       GROUP BY n.id`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un negocio con id "${id}"`);
    return rows[0];
  }

  /** Puede tocar la ficha: el propio dueño asignado, o cualquier super_admin. */
  private verificarPropiedad(cuenta: Cuenta, negocioId: string): void {
    if (cuenta.rol === "super_admin") return;
    if (cuenta.rol === "dueno_negocio" && cuenta.negocioIds.includes(negocioId)) return;
    throw new ForbiddenException("No administras este negocio.");
  }

  /** Dueño de negocio: solo los suyos, sin importar su estado — necesita ver hasta lo rechazado. */
  async listarMios(cuenta: Cuenta): Promise<Negocio[]> {
    if (cuenta.negocioIds.length === 0) return [];
    const { rows } = await this.bd.consultar<FilaNegocio>(
      `SELECT ${COLUMNAS_NEGOCIO}
       FROM negocios n
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE n.id = ANY($1)
       GROUP BY n.id
       ORDER BY n.nombre`,
      [cuenta.negocioIds],
    );
    return rows.map(aNegocio);
  }

  /** Historial de validación: ya resueltos (validados alguna vez), acotados al alcance de la cuenta. */
  async listarHistorial(cuenta: Cuenta): Promise<Negocio[]> {
    const { rows } = await this.bd.consultar<FilaNegocio>(
      `SELECT ${COLUMNAS_NEGOCIO}
       FROM negocios n
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE n.estado <> 'por_verificar' AND n.validado_por_cuenta_id IS NOT NULL
       GROUP BY n.id
       ORDER BY n.actualizado_en DESC`,
    );
    return rows.filter((fila) => dentroDelAlcance(cuenta, fila.distrito_ubigeo)).map(aNegocio);
  }

  /**
   * Panel del super-admin: todos los negocios, sin importar su estado — paginado (antes traía
   * todo de una vez, sin límite; ver docs/decisiones/0021-endurecimiento-post-diagnostico.md).
   */
  async listarAdmin(cursor: string | undefined, limite: number): Promise<ResultadoPaginado<Negocio>> {
    const condiciones = ["true"];
    const valores: unknown[] = [];

    const cursorDecodificado = decodificarCursor(cursor);
    if (cursorDecodificado) {
      valores.push(cursorDecodificado.creadoEn, cursorDecodificado.id);
      condiciones.push(`(n.creado_en, n.id) < ($${valores.length - 1}, $${valores.length})`);
    }
    valores.push(limite + 1);

    const { rows } = await this.bd.consultar<FilaNegocio>(
      `SELECT ${COLUMNAS_NEGOCIO}
       FROM negocios n
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE ${condiciones.join(" AND ")}
       GROUP BY n.id
       ORDER BY n.creado_en DESC, n.id DESC
       LIMIT $${valores.length}`,
      valores,
    );

    const hayMas = rows.length > limite;
    const items = rows.slice(0, limite).map(aNegocio);
    const ultimo = items[items.length - 1];
    const cursorSiguiente = hayMas && ultimo ? codificarCursor({ creadoEn: ultimo.creadoEn, id: ultimo.id }) : null;
    return { items, cursorSiguiente };
  }

  /** Cola de validación: por_verificar, acotados al alcance de distritos de la cuenta. */
  async listarPendientes(cuenta: Cuenta): Promise<Negocio[]> {
    const { rows } = await this.bd.consultar<FilaNegocio>(
      `SELECT ${COLUMNAS_NEGOCIO}
       FROM negocios n
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE n.estado = 'por_verificar'
       GROUP BY n.id
       ORDER BY n.actualizado_en DESC`,
    );
    return rows.filter((fila) => dentroDelAlcance(cuenta, fila.distrito_ubigeo)).map(aNegocio);
  }

  /** Alta rápida desde el panel — la ficha completa (fotos, horario, descripción) se llena después. */
  async crear(dto: CrearNegocioDto): Promise<Negocio> {
    const id = `neg-${randomUUID()}`;
    return this.bd.transaccion(async (db) => {
      const { rows: filaComunidad } = await db.consultar<{ lat: number; lng: number }>(
        "SELECT ST_Y(centro::geometry) AS lat, ST_X(centro::geometry) AS lng FROM comunidades WHERE id = $1",
        [dto.comunidadId],
      );
      if (!filaComunidad[0]) throw new NotFoundException(`No existe una comunidad con id "${dto.comunidadId}"`);
      const { lat, lng } = filaComunidad[0];

      await db.consultar(
        `INSERT INTO negocios (id, comunidad_id, distrito_ubigeo, nombre, descripcion, coordenada, direccion,
                                telefono, whatsapp, horarios, estado, fuente, creado_en, actualizado_en)
         VALUES ($1, $2, $3, $4, '', ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, $8, $9, $10,
                 'por_verificar', 'carga_manual_piloto', now(), now())`,
        [
          id,
          dto.comunidadId,
          dto.distritoUbigeo,
          dto.nombre,
          lng,
          lat,
          dto.direccion,
          dto.telefono ?? null,
          dto.whatsapp ?? null,
          JSON.stringify(HORARIO_SEMANA_CERRADA),
        ],
      );
      for (const categoriaId of dto.categoriaIds) {
        await db.consultar("INSERT INTO negocio_categorias (negocio_id, categoria_id) VALUES ($1, $2)", [
          id,
          categoriaId,
        ]);
      }
      const { rows } = await db.consultar<FilaNegocio>(
        `SELECT ${COLUMNAS_NEGOCIO}
         FROM negocios n LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
         WHERE n.id = $1 GROUP BY n.id`,
        [id],
      );
      return aNegocio(rows[0]);
    });
  }

  async aprobar(id: string, cuenta: Cuenta): Promise<Negocio> {
    const fila = await this.obtenerFilaAdminOFallar(id);
    if (!dentroDelAlcance(cuenta, fila.distrito_ubigeo)) {
      throw new ForbiddenException("Este negocio no está dentro de tus distritos asignados.");
    }
    await this.bd.consultar(
      `UPDATE negocios
       SET estado = 'activo', verificado_en = now(), validado_por_cuenta_id = $2, motivo_rechazo = NULL,
           actualizado_en = now()
       WHERE id = $1`,
      [id, cuenta.id],
    );
    const negocio = aNegocio(await this.obtenerFilaAdminOFallar(id));
    await this.busqueda.sincronizarNegocio(negocio); // ahora es público — entra al índice
    await this.auditoria.registrar("aprobar", "negocio", id, cuenta.id);
    return negocio;
  }

  /**
   * Mismo criterio que ya tenía apps/admin/src/estado/useNegocios.ts: si ya estaba verificado
   * antes (edición), un rechazo lo vuelve a dejar "activo" con lo último aprobado — nunca lo
   * saca de la app por corregir un dato. Si era alta nueva, queda "inactivo" hasta corregirlo.
   */
  async rechazar(id: string, motivo: string, cuenta: Cuenta): Promise<Negocio> {
    const fila = await this.obtenerFilaAdminOFallar(id);
    if (!dentroDelAlcance(cuenta, fila.distrito_ubigeo)) {
      throw new ForbiddenException("Este negocio no está dentro de tus distritos asignados.");
    }
    const estadoResultante = fila.verificado_en ? "activo" : "inactivo";
    await this.bd.consultar(
      `UPDATE negocios
       SET estado = $2, validado_por_cuenta_id = $3, motivo_rechazo = $4, actualizado_en = now()
       WHERE id = $1`,
      [id, estadoResultante, cuenta.id, motivo],
    );
    const negocio = aNegocio(await this.obtenerFilaAdminOFallar(id));
    // Si quedó "inactivo" se saca del índice; si volvió a "activo" (edición rechazada), se actualiza.
    await this.busqueda.sincronizarNegocio(negocio);
    await this.auditoria.registrar("rechazar", "negocio", id, cuenta.id, { motivo });
    return negocio;
  }

  /** Cambios sensibles (nombre, dirección, categorías) vuelven a mandar el negocio a revisión. */
  async actualizarInfo(id: string, dto: ActualizarInfoNegocioDto, cuenta: Cuenta): Promise<Negocio> {
    this.verificarPropiedad(cuenta, id);
    const anterior = await this.obtenerFilaAdminOFallar(id);
    const categoriasAnteriores = [...anterior.categoria_ids].sort().join(",");
    const categoriasNuevas = [...dto.categoriaIds].sort().join(",");
    const cambioSensible =
      dto.nombre !== anterior.nombre || dto.direccion !== anterior.direccion || categoriasNuevas !== categoriasAnteriores;

    await this.bd.transaccion(async (db) => {
      await db.consultar(
        `UPDATE negocios
         SET nombre = $2, descripcion = $3, direccion = $4, telefono = $5, whatsapp = $6,
             estado = CASE WHEN $7 THEN 'por_verificar'::estado_negocio ELSE estado END,
             motivo_rechazo = CASE WHEN $7 THEN NULL ELSE motivo_rechazo END,
             actualizado_en = now()
         WHERE id = $1`,
        [id, dto.nombre, dto.descripcion, dto.direccion, dto.telefono ?? null, dto.whatsapp ?? null, cambioSensible],
      );
      await db.consultar("DELETE FROM negocio_categorias WHERE negocio_id = $1", [id]);
      for (const categoriaId of dto.categoriaIds) {
        await db.consultar("INSERT INTO negocio_categorias (negocio_id, categoria_id) VALUES ($1, $2)", [
          id,
          categoriaId,
        ]);
      }
    });
    const negocio = aNegocio(await this.obtenerFilaAdminOFallar(id));
    // Un cambio sensible lo vuelve "por_verificar" (se saca del índice hasta que se re-apruebe);
    // uno no sensible (descripción/teléfono/WhatsApp) se sigue viendo "activo" y se re-indexa.
    await this.busqueda.sincronizarNegocio(negocio);
    return negocio;
  }

  async actualizarHorarios(id: string, horarios: ActualizarHorariosDto, cuenta: Cuenta): Promise<Negocio> {
    this.verificarPropiedad(cuenta, id);
    await this.obtenerFilaAdminOFallar(id);
    await this.bd.consultar("UPDATE negocios SET horarios = $2, actualizado_en = now() WHERE id = $1", [
      id,
      JSON.stringify(horarios),
    ]);
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }

  async agregarOferta(id: string, dto: AgregarOfertaDto, cuenta: Cuenta): Promise<Negocio> {
    this.verificarPropiedad(cuenta, id);
    await this.obtenerFilaAdminOFallar(id);
    const oferta: OfertaNegocio = {
      nombre: dto.nombre,
      precio: dto.precio,
      precioOriginal: dto.precioOriginal,
      etiqueta: dto.etiqueta,
    };
    await this.bd.consultar(
      `UPDATE negocios SET ofertas = COALESCE(ofertas, '[]'::jsonb) || $2::jsonb, actualizado_en = now() WHERE id = $1`,
      [id, JSON.stringify([oferta])],
    );
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }

  async eliminarOferta(id: string, indice: number, cuenta: Cuenta): Promise<Negocio> {
    this.verificarPropiedad(cuenta, id);
    await this.obtenerFilaAdminOFallar(id);
    // El cast ::int es obligatorio: sin él, Postgres resuelve "jsonb - $2" con el operador de
    // texto (borra por clave, no por posición) y la operación no hace nada, sin error visible.
    await this.bd.consultar(
      `UPDATE negocios SET ofertas = COALESCE(ofertas, '[]'::jsonb) - $2::int, actualizado_en = now() WHERE id = $1`,
      [id, indice],
    );
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }

  /**
   * `nombreArchivo` ya viene guardado en disco (lo dejó ahí multer/diskStorage antes de
   * llegar acá) — este método solo actualiza el negocio para que apunte a él, y borra el
   * archivo anterior si había uno (evita que se acumulen fotos huérfanas en disco cada vez
   * que alguien reemplaza su foto). Ver docs/decisiones/0021-endurecimiento-post-diagnostico.md.
   */
  async actualizarFoto(id: string, nombreArchivo: string, cuenta: Cuenta): Promise<Negocio> {
    this.verificarPropiedad(cuenta, id);
    const anterior = await this.obtenerFilaAdminOFallar(id);
    await this.bd.consultar("UPDATE negocios SET foto_principal_url = $2, actualizado_en = now() WHERE id = $1", [
      id,
      `/uploads/negocios/${nombreArchivo}`,
    ]);
    if (anterior.foto_principal_url?.startsWith("/uploads/negocios/")) {
      const archivoAnterior = join(DIRECTORIO_FOTOS_NEGOCIO, anterior.foto_principal_url.replace("/uploads/negocios/", ""));
      await unlink(archivoAnterior).catch(() => undefined); // no existir ya no es un error real acá
    }
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }

  /**
   * No hay CRUD de productos todavía (se cargan por migración/carga manual) — esto solo permite
   * ponerle o cambiarle la foto a uno que ya existe. Ver docs/decisiones/0028-fotos-productos-galeria-y-publicidad.md.
   */
  async actualizarFotoProducto(
    negocioId: string,
    productoId: string,
    nombreArchivo: string,
    cuenta: Cuenta,
  ): Promise<Producto> {
    this.verificarPropiedad(cuenta, negocioId);
    const { rows } = await this.bd.consultar<{ foto_url: string | null }>(
      "SELECT foto_url FROM productos WHERE id = $1 AND negocio_id = $2",
      [productoId, negocioId],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un producto con id "${productoId}" en este negocio.`);
    const anterior = rows[0].foto_url;

    await this.bd.consultar("UPDATE productos SET foto_url = $2 WHERE id = $1", [
      productoId,
      `/uploads/productos/${nombreArchivo}`,
    ]);
    if (anterior?.startsWith("/uploads/productos/")) {
      await unlink(join(DIRECTORIO_FOTOS_PRODUCTO, anterior.replace("/uploads/productos/", ""))).catch(() => undefined);
    }

    const { rows: actualizado } = await this.bd.consultar<FilaProducto>(
      "SELECT id, negocio_id, nombre, descripcion, precio, categoria_menu, destacado, foto_url FROM productos WHERE id = $1",
      [productoId],
    );
    return aProducto(actualizado[0]);
  }

  /** Hasta 6 fotos — solo se usan cuando el negocio no tiene menú/catálogo/servicios/ofertas (GaleriaNegocio.tsx). */
  async agregarFotoGaleria(id: string, nombreArchivo: string, cuenta: Cuenta): Promise<Negocio> {
    this.verificarPropiedad(cuenta, id);
    const anterior = await this.obtenerFilaAdminOFallar(id);
    if (anterior.fotos_galeria.length >= 6) {
      throw new ForbiddenException("Ya se subieron las 6 fotos de galería permitidas — borra alguna primero.");
    }
    await this.bd.consultar(
      "UPDATE negocios SET fotos_galeria = array_append(fotos_galeria, $2), actualizado_en = now() WHERE id = $1",
      [id, `/uploads/negocios/${nombreArchivo}`],
    );
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }

  async eliminarFotoGaleria(id: string, url: string, cuenta: Cuenta): Promise<Negocio> {
    this.verificarPropiedad(cuenta, id);
    await this.obtenerFilaAdminOFallar(id);
    await this.bd.consultar(
      "UPDATE negocios SET fotos_galeria = array_remove(fotos_galeria, $2), actualizado_en = now() WHERE id = $1",
      [id, url],
    );
    if (url.startsWith("/uploads/negocios/")) {
      await unlink(join(DIRECTORIO_FOTOS_NEGOCIO, url.replace("/uploads/negocios/", ""))).catch(() => undefined);
    }
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }
}
