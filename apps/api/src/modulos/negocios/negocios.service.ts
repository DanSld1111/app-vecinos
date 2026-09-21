import { randomUUID } from "crypto";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Cuenta, Negocio, OfertaNegocio, Producto, ResultadoPaginado } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { codificarCursor, decodificarCursor } from "../../comun/paginacion";
import { dentroDelAlcance } from "../../comun/alcance";
import { BusquedaService } from "../busqueda/busqueda.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { COLUMNAS_NEGOCIO, FilaNegocio, aNegocio } from "./negocios.mapeo";
import { FilaProducto, aProducto, COLUMNAS_PRODUCTO } from "./productos.mapeo";
import { CARPETA_FOTOS_NEGOCIO } from "./foto-negocio.config";
import { CARPETA_FOTOS_PRODUCTO } from "./foto-producto.config";
import { ListarNegociosDto } from "./dto/listar-negocios.dto";
import { CrearNegocioDto } from "./dto/crear-negocio.dto";
import { ActualizarInfoNegocioDto } from "./dto/actualizar-info-negocio.dto";
import { ActualizarHorariosDto } from "./dto/actualizar-horarios.dto";
import { AgregarOfertaDto } from "./dto/agregar-oferta.dto";
import { GuardarProductoDto } from "./dto/guardar-producto.dto";

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
    private readonly almacenamiento: AlmacenamientoService,
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
         WHERE n.comunidad_id = $1 AND n.estado = 'activo' AND n.archivado_en IS NULL AND n.nombre ILIKE $2
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
       WHERE n.id = ANY($1) AND n.estado = 'activo' AND n.archivado_en IS NULL
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
    const condiciones: string[] = ["n.comunidad_id = $1", "n.estado = 'activo'", "n.archivado_en IS NULL"];
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
       WHERE n.id = $1 AND n.estado = 'activo' AND n.archivado_en IS NULL
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
  /**
   * Lectura pública (la carta que ve el vecino): nunca lo que está en la papelera. El orden lo
   * fija el dueño arrastrando dentro de cada sección — `nombre` solo desempata productos que
   * nunca se reordenaron (todos con orden 0).
   */
  async listarProductos(negocioId: string): Promise<Producto[]> {
    const { rows } = await this.bd.consultar<FilaProducto>(
      `SELECT ${COLUMNAS_PRODUCTO}
       FROM productos
       WHERE negocio_id = $1 AND eliminado_en IS NULL
       ORDER BY categoria_menu, orden, nombre`,
      [negocioId],
    );
    return rows.map(aProducto);
  }

  /** Para la ficha del panel: cualquier estado, pero solo para quien administra ese negocio. */
  async obtenerParaAdmin(id: string, cuenta: Cuenta): Promise<Negocio> {
    this.verificarAccesoBasico(cuenta, id);
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
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

  /**
   * Acceso básico a la ficha: verla y editar información general (nombre, categoría,
   * dirección, contacto). Incluye a gestor_negocios a propósito — es justo lo que su rol
   * administrativo necesita para dar de alta y completar un negocio — pero NO a lo operativo
   * (horario, fotos, productos, ofertas), que usa verificarGestionOperativa() más abajo.
   */
  private verificarAccesoBasico(cuenta: Cuenta, negocioId: string): void {
    if (cuenta.rol === "super_admin" || cuenta.rol === "gestor_negocios") return;
    if (cuenta.rol === "dueno_negocio" && cuenta.negocioIds.includes(negocioId)) return;
    throw new ForbiddenException("No administras este negocio.");
  }

  /**
   * Gestión operativa del día a día: horario, fotos, productos, ofertas y galería. Ver
   * docs/decisiones/0071-plan-v2-modulo-negocios.md — gestor_negocios queda deliberadamente
   * afuera de este círculo: es un rol administrativo (alta + vínculo con el dueño), no quien
   * lleva el negocio.
   */
  private verificarGestionOperativa(cuenta: Cuenta, negocioId: string): void {
    if (cuenta.rol === "super_admin") return;
    if (cuenta.rol === "dueno_negocio" && cuenta.negocioIds.includes(negocioId)) return;
    throw new ForbiddenException("Esta acción es del dueño del negocio — un gestor administrativo no la tiene.");
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
  /**
   * `soloArchivados`: por defecto el listado del panel no muestra lo archivado (igual que un
   * `eliminado_en` normal) — se pide explícitamente para ver esa vista ("Ver archivados").
   */
  async listarAdmin(
    cursor: string | undefined,
    limite: number,
    soloArchivados = false,
  ): Promise<ResultadoPaginado<Negocio>> {
    const condiciones = [soloArchivados ? "n.archivado_en IS NOT NULL" : "n.archivado_en IS NULL"];
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
      // Si el alta no trae la ubicación exacta, se usa el centro de la comunidad como
      // aproximación y se corrige después desde la ficha (PUT :id/info acepta `coordenada`).
      const { lat, lng } = dto.coordenada ?? filaComunidad[0];

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
   * Bajar un negocio de la app sin borrarlo: cerró, se mudó, o hay algo que revisar. Se puede
   * volver a publicar con `aprobar()` — `verificado_en` no se toca, así que no pierde el
   * registro de que en algún momento fue verificado.
   */
  async despublicar(id: string, cuenta: Cuenta): Promise<Negocio> {
    const fila = await this.obtenerFilaAdminOFallar(id);
    if (!dentroDelAlcance(cuenta, fila.distrito_ubigeo)) {
      throw new ForbiddenException("Este negocio no está dentro de tus distritos asignados.");
    }
    await this.bd.consultar(
      "UPDATE negocios SET estado = 'inactivo', validado_por_cuenta_id = $2, actualizado_en = now() WHERE id = $1",
      [id, cuenta.id],
    );
    const negocio = aNegocio(await this.obtenerFilaAdminOFallar(id));
    await this.busqueda.sincronizarNegocio(negocio); // deja de ser público — sale del índice
    await this.auditoria.registrar("despublicar", "negocio", id, cuenta.id);
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

  /**
   * Archivar: reversible. Sale del listado del panel (y de la app, igual que "despublicar")
   * pero la fila y su historial —productos, reseñas— quedan intactos, listos para restaurar.
   * Pensado para negocios que cerraron o se dieron de alta por error, no para una baja
   * temporal (eso ya lo cubre despublicar). Solo super_admin — ver @Roles en el controller.
   */
  async archivar(id: string, cuenta: Cuenta): Promise<Negocio> {
    await this.obtenerFilaAdminOFallar(id);
    await this.bd.consultar("UPDATE negocios SET archivado_en = now(), actualizado_en = now() WHERE id = $1", [id]);
    const negocio = aNegocio(await this.obtenerFilaAdminOFallar(id));
    await this.busqueda.sincronizarNegocio({ ...negocio, estado: "inactivo" }); // fuera del índice mientras esté archivado
    await this.auditoria.registrar("archivar", "negocio", id, cuenta.id);
    return negocio;
  }

  async restaurarArchivo(id: string, cuenta: Cuenta): Promise<Negocio> {
    await this.obtenerFilaAdminOFallar(id);
    await this.bd.consultar("UPDATE negocios SET archivado_en = NULL, actualizado_en = now() WHERE id = $1", [id]);
    const negocio = aNegocio(await this.obtenerFilaAdminOFallar(id));
    await this.busqueda.sincronizarNegocio(negocio); // vuelve al índice si su estado sigue siendo "activo"
    await this.auditoria.registrar("restaurar-archivo", "negocio", id, cuenta.id);
    return negocio;
  }

  /**
   * Borrado definitivo — sin vuelta atrás, a diferencia de Archivar. La fila se borra de
   * verdad; productos, categorías del negocio y reseñas se van con ella en cascada (migración
   * 0018), y los anuncios que la referenciaban quedan huérfanos (negocio_id → NULL) en vez de
   * borrarse. El panel pide confirmación antes de llegar hasta acá — esto no vuelve a preguntar.
   */
  async eliminar(id: string, cuenta: Cuenta): Promise<void> {
    const fila = await this.obtenerFilaAdminOFallar(id);
    const negocio = aNegocio(fila);
    const { rows: fotosProducto } = await this.bd.consultar<{ foto_url: string | null }>(
      "SELECT foto_url FROM productos WHERE negocio_id = $1 AND foto_url IS NOT NULL",
      [id],
    );

    await this.busqueda.sincronizarNegocio({ ...negocio, estado: "inactivo" });
    await this.bd.consultar("DELETE FROM negocios WHERE id = $1", [id]);

    await Promise.all([
      this.almacenamiento.eliminarPorUrl(negocio.fotoPrincipalUrl),
      ...negocio.fotosGaleria.map((url) => this.almacenamiento.eliminarPorUrl(url)),
      ...fotosProducto.map((p) => this.almacenamiento.eliminarPorUrl(p.foto_url)),
    ]);
    await this.auditoria.registrar("eliminar", "negocio", id, cuenta.id, { nombre: negocio.nombre });
  }

  /**
   * Editar NO manda el negocio a revisión — ni para el dueño ni para el admin: el cambio se ve
   * en la app de inmediato (decisión del usuario, ver docs/decisiones/0066-edicion-sin-validacion.md).
   *
   * Antes, tocar nombre/dirección/categorías se consideraba "cambio sensible" y devolvía el
   * negocio a `por_verificar`, lo que lo sacaba de la app pública (`obtenerPorId()` filtra por
   * estado activo) hasta que alguien volviera a aprobarlo — corregir una tilde bajaba la ficha
   * sin avisar. La cola de validación sigue existiendo para los negocios recién creados, que
   * nacen en `por_verificar` hasta que se publican.
   */
  async actualizarInfo(id: string, dto: ActualizarInfoNegocioDto, cuenta: Cuenta): Promise<Negocio> {
    this.verificarAccesoBasico(cuenta, id);
    await this.obtenerFilaAdminOFallar(id);

    await this.bd.transaccion(async (db) => {
      await db.consultar(
        `UPDATE negocios
         SET nombre = $2, descripcion = $3, direccion = $4, telefono = $5, whatsapp = $6,
             -- coordenada y moneda son opcionales: si no vienen, se deja lo que ya había
             -- (por eso el CASE y no un COALESCE sobre el valor nuevo).
             coordenada = CASE WHEN $7 THEN ST_SetSRID(ST_MakePoint($8, $9), 4326)::geography ELSE coordenada END,
             moneda = COALESCE($10, moneda),
             actualizado_en = now()
         WHERE id = $1`,
        [
          id,
          dto.nombre,
          dto.descripcion,
          dto.direccion,
          dto.telefono ?? null,
          dto.whatsapp ?? null,
          Boolean(dto.coordenada),
          dto.coordenada?.lng ?? 0,
          dto.coordenada?.lat ?? 0,
          dto.moneda ?? null,
        ],
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
    // El estado no cambia al editar, pero el índice de búsqueda sí tiene que reflejar el nombre
    // o la dirección nuevos.
    await this.busqueda.sincronizarNegocio(negocio);
    await this.auditoria.registrar("actualizar", "negocio", id, cuenta.id);
    return negocio;
  }

  async actualizarHorarios(id: string, horarios: ActualizarHorariosDto, cuenta: Cuenta): Promise<Negocio> {
    this.verificarGestionOperativa(cuenta, id);
    await this.obtenerFilaAdminOFallar(id);
    await this.bd.consultar("UPDATE negocios SET horarios = $2, actualizado_en = now() WHERE id = $1", [
      id,
      JSON.stringify(horarios),
    ]);
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }

  async agregarOferta(id: string, dto: AgregarOfertaDto, cuenta: Cuenta): Promise<Negocio> {
    this.verificarGestionOperativa(cuenta, id);
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
    this.verificarGestionOperativa(cuenta, id);
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
  async actualizarFoto(id: string, archivo: Express.Multer.File, cuenta: Cuenta): Promise<Negocio> {
    this.verificarGestionOperativa(cuenta, id);
    const anterior = await this.obtenerFilaAdminOFallar(id);
    const url = await this.almacenamiento.subir(CARPETA_FOTOS_NEGOCIO, archivo.buffer, archivo.originalname, archivo.mimetype);
    await this.bd.consultar("UPDATE negocios SET foto_principal_url = $2, actualizado_en = now() WHERE id = $1", [id, url]);
    await this.almacenamiento.eliminarPorUrl(anterior.foto_principal_url); // no existir ya no es un error real acá
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }

  /**
   * No hay CRUD de productos todavía (se cargan por migración/carga manual) — esto solo permite
   * ponerle o cambiarle la foto a uno que ya existe. Ver docs/decisiones/0028-fotos-productos-galeria-y-publicidad.md.
   */
  async actualizarFotoProducto(
    negocioId: string,
    productoId: string,
    archivo: Express.Multer.File,
    cuenta: Cuenta,
  ): Promise<Producto> {
    this.verificarGestionOperativa(cuenta, negocioId);
    const { rows } = await this.bd.consultar<{ foto_url: string | null }>(
      "SELECT foto_url FROM productos WHERE id = $1 AND negocio_id = $2",
      [productoId, negocioId],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un producto con id "${productoId}" en este negocio.`);
    const anterior = rows[0].foto_url;

    const url = await this.almacenamiento.subir(CARPETA_FOTOS_PRODUCTO, archivo.buffer, archivo.originalname, archivo.mimetype);
    await this.bd.consultar("UPDATE productos SET foto_url = $2 WHERE id = $1", [productoId, url]);
    await this.almacenamiento.eliminarPorUrl(anterior);

    return this.obtenerProductoOFallar(negocioId, productoId);
  }

  /** Quitar la foto sin borrar el producto — también borra el archivo de Supabase Storage. */
  async quitarFotoProducto(negocioId: string, productoId: string, cuenta: Cuenta): Promise<Producto> {
    this.verificarGestionOperativa(cuenta, negocioId);
    const anterior = await this.obtenerProductoOFallar(negocioId, productoId);
    await this.bd.consultar("UPDATE productos SET foto_url = NULL WHERE id = $1", [productoId]);
    await this.almacenamiento.eliminarPorUrl(anterior.fotoUrl);
    return this.obtenerProductoOFallar(negocioId, productoId);
  }

  // ---- CRUD de productos ----
  // Antes solo existían "listar" y "cambiar la foto": los productos únicamente podían entrar por
  // carga de datos directa a la base. Ver docs/decisiones/0065-crud-productos.md.

  private async obtenerProductoOFallar(negocioId: string, productoId: string): Promise<Producto> {
    const { rows } = await this.bd.consultar<FilaProducto>(
      `SELECT ${COLUMNAS_PRODUCTO} FROM productos WHERE id = $1 AND negocio_id = $2`,
      [productoId, negocioId],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un producto con id "${productoId}" en este negocio.`);
    return aProducto(rows[0]);
  }

  async crearProducto(negocioId: string, dto: GuardarProductoDto, cuenta: Cuenta): Promise<Producto> {
    this.verificarGestionOperativa(cuenta, negocioId);
    await this.obtenerFilaAdminOFallar(negocioId);
    const id = `prod-${randomUUID()}`;
    // Entra al final de su sección, no al principio — quien lo agrega espera verlo abajo.
    await this.bd.consultar(
      `INSERT INTO productos (id, negocio_id, nombre, descripcion, precio, categoria_menu, destacado, atributos, orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
               COALESCE((SELECT MAX(orden) + 1 FROM productos WHERE negocio_id = $2 AND categoria_menu = $6), 0))`,
      [
        id,
        negocioId,
        dto.nombre,
        dto.descripcion,
        dto.precio,
        dto.categoriaMenu,
        dto.destacado ?? false,
        JSON.stringify(dto.atributos ?? {}),
      ],
    );
    await this.auditoria.registrar("crear", "producto", id, cuenta.id, { negocioId });
    return this.obtenerProductoOFallar(negocioId, id);
  }

  async actualizarProducto(
    negocioId: string,
    productoId: string,
    dto: GuardarProductoDto,
    cuenta: Cuenta,
  ): Promise<Producto> {
    this.verificarGestionOperativa(cuenta, negocioId);
    const anterior = await this.obtenerProductoOFallar(negocioId, productoId);
    // Si cambió de sección, se manda al final de la nueva: su posición anterior no significa
    // nada en otra lista.
    const cambioDeSeccion = dto.categoriaMenu !== anterior.categoriaMenu;
    await this.bd.consultar(
      `UPDATE productos
       SET nombre = $3, descripcion = $4, precio = $5, categoria_menu = $6, destacado = $7, atributos = $9,
           orden = CASE WHEN $8
                        THEN COALESCE((SELECT MAX(orden) + 1 FROM productos WHERE negocio_id = $2 AND categoria_menu = $6), 0)
                        ELSE orden END
       WHERE id = $1 AND negocio_id = $2`,
      [
        productoId,
        negocioId,
        dto.nombre,
        dto.descripcion,
        dto.precio,
        dto.categoriaMenu,
        dto.destacado ?? false,
        cambioDeSeccion,
        JSON.stringify(dto.atributos ?? {}),
      ],
    );
    await this.auditoria.registrar("actualizar", "producto", productoId, cuenta.id, { negocioId });
    return this.obtenerProductoOFallar(negocioId, productoId);
  }

  /** A la papelera (borrado lógico, recuperable). No se purga sola: ver eliminarProductoDefinitivo. */
  async eliminarProducto(negocioId: string, productoId: string, cuenta: Cuenta): Promise<void> {
    this.verificarGestionOperativa(cuenta, negocioId);
    const { rowCount } = await this.bd.consultar(
      "UPDATE productos SET eliminado_en = now() WHERE id = $1 AND negocio_id = $2 AND eliminado_en IS NULL",
      [productoId, negocioId],
    );
    if (!rowCount) throw new NotFoundException(`No existe un producto vigente con id "${productoId}" en este negocio.`);
    await this.auditoria.registrar("eliminar", "producto", productoId, cuenta.id, { negocioId });
  }

  async restaurarProducto(negocioId: string, productoId: string, cuenta: Cuenta): Promise<Producto> {
    this.verificarGestionOperativa(cuenta, negocioId);
    const { rowCount } = await this.bd.consultar(
      "UPDATE productos SET eliminado_en = NULL WHERE id = $1 AND negocio_id = $2 AND eliminado_en IS NOT NULL",
      [productoId, negocioId],
    );
    if (!rowCount) throw new NotFoundException(`No hay un producto en la papelera con id "${productoId}".`);
    await this.auditoria.registrar("restaurar", "producto", productoId, cuenta.id, { negocioId });
    return this.obtenerProductoOFallar(negocioId, productoId);
  }

  /** Único borrado real: saca la fila y la foto de Supabase Storage. Sin vuelta atrás. */
  async eliminarProductoDefinitivo(negocioId: string, productoId: string, cuenta: Cuenta): Promise<void> {
    this.verificarGestionOperativa(cuenta, negocioId);
    const producto = await this.obtenerProductoOFallar(negocioId, productoId);
    await this.bd.consultar("DELETE FROM productos WHERE id = $1 AND negocio_id = $2", [productoId, negocioId]);
    await this.almacenamiento.eliminarPorUrl(producto.fotoUrl);
    await this.auditoria.registrar("eliminar_definitivo", "producto", productoId, cuenta.id, { negocioId });
  }

  /** La papelera es por negocio, no global: se ve dentro de la misma pestaña de productos. */
  async listarProductosPapelera(negocioId: string, cuenta: Cuenta): Promise<Producto[]> {
    this.verificarGestionOperativa(cuenta, negocioId);
    const { rows } = await this.bd.consultar<FilaProducto>(
      `SELECT ${COLUMNAS_PRODUCTO}
       FROM productos
       WHERE negocio_id = $1 AND eliminado_en IS NOT NULL
       ORDER BY eliminado_en DESC`,
      [negocioId],
    );
    return rows.map(aProducto);
  }

  /** Recibe los ids en el orden final (tras arrastrar) y les asigna 0..n de una sola vez. */
  async reordenarProductos(negocioId: string, idsEnOrden: string[], cuenta: Cuenta): Promise<Producto[]> {
    this.verificarGestionOperativa(cuenta, negocioId);
    await this.bd.transaccion(async (db) => {
      for (const [indice, productoId] of idsEnOrden.entries()) {
        await db.consultar("UPDATE productos SET orden = $3 WHERE id = $1 AND negocio_id = $2", [
          productoId,
          negocioId,
          indice,
        ]);
      }
    });
    return this.listarProductos(negocioId);
  }

  /** Hasta 6 fotos — solo se usan cuando el negocio no tiene menú/catálogo/servicios/ofertas (GaleriaNegocio.tsx). */
  async agregarFotoGaleria(id: string, archivo: Express.Multer.File, cuenta: Cuenta): Promise<Negocio> {
    this.verificarGestionOperativa(cuenta, id);
    const anterior = await this.obtenerFilaAdminOFallar(id);
    if (anterior.fotos_galeria.length >= 6) {
      throw new ForbiddenException("Ya se subieron las 6 fotos de galería permitidas — borra alguna primero.");
    }
    const url = await this.almacenamiento.subir(CARPETA_FOTOS_NEGOCIO, archivo.buffer, archivo.originalname, archivo.mimetype);
    await this.bd.consultar(
      "UPDATE negocios SET fotos_galeria = array_append(fotos_galeria, $2), actualizado_en = now() WHERE id = $1",
      [id, url],
    );
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }

  async eliminarFotoGaleria(id: string, url: string, cuenta: Cuenta): Promise<Negocio> {
    this.verificarGestionOperativa(cuenta, id);
    await this.obtenerFilaAdminOFallar(id);
    await this.bd.consultar(
      "UPDATE negocios SET fotos_galeria = array_remove(fotos_galeria, $2), actualizado_en = now() WHERE id = $1",
      [id, url],
    );
    await this.almacenamiento.eliminarPorUrl(url);
    return aNegocio(await this.obtenerFilaAdminOFallar(id));
  }
}
