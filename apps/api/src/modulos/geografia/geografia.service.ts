import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Comunidad, Distrito } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { CrearComunidadDto } from "./dto/crear-comunidad.dto";

interface FilaComunidad {
  id: string;
  distrito_ubigeo: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  activo: boolean;
  fecha_lanzamiento: string | null;
  lat: number;
  lng: number;
}

interface FilaDistrito {
  ubigeo: string;
  provincia_ubigeo: string;
  nombre: string;
  activo: boolean;
  lat: number;
  lng: number;
}

const COLUMNAS_COMUNIDAD = `
  id, distrito_ubigeo, nombre, slug, descripcion, activo, fecha_lanzamiento,
  ST_Y(centro::geometry) AS lat, ST_X(centro::geometry) AS lng
`;

const COLUMNAS_DISTRITO = `
  ubigeo, provincia_ubigeo, nombre, activo, ST_Y(centro::geometry) AS lat, ST_X(centro::geometry) AS lng
`;

function aComunidad(fila: FilaComunidad): Comunidad {
  return {
    id: fila.id,
    distritoUbigeo: fila.distrito_ubigeo,
    nombre: fila.nombre,
    slug: fila.slug,
    centro: { lat: fila.lat, lng: fila.lng },
    descripcion: fila.descripcion,
    activo: fila.activo,
    fechaLanzamiento: fila.fecha_lanzamiento,
  };
}

function aDistrito(fila: FilaDistrito): Distrito {
  return {
    ubigeo: fila.ubigeo,
    provinciaUbigeo: fila.provincia_ubigeo,
    nombre: fila.nombre,
    centro: { lat: fila.lat, lng: fila.lng },
    activo: fila.activo,
  };
}

/** 23503 = foreign_key_violation — algún negocio/aviso/vecino todavía apunta a esta comunidad. */
function esErrorReferenciado(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23503";
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
export class GeografiaService {
  constructor(private readonly bd: BaseDatosService) {}

  async listarComunidadesActivas(): Promise<Comunidad[]> {
    const { rows } = await this.bd.consultar<FilaComunidad>(
      `SELECT ${COLUMNAS_COMUNIDAD} FROM comunidades WHERE activo = true ORDER BY nombre`,
    );
    return rows.map(aComunidad);
  }

  async obtenerPorId(id: string): Promise<Comunidad | null> {
    const { rows } = await this.bd.consultar<FilaComunidad>(
      `SELECT ${COLUMNAS_COMUNIDAD} FROM comunidades WHERE id = $1`,
      [id],
    );
    return rows[0] ? aComunidad(rows[0]) : null;
  }

  /**
   * Aproximación deliberada: las comunidades hoy solo tienen un punto "centro"
   * (ver geografia.ts), no un polígono real. "Detectar" es en realidad "encontrar la
   * comunidad activa más cercana, si está dentro de un radio razonable". El día que
   * exista un polígono por comunidad, esto pasa a ser un ST_Contains y deja de ser
   * una aproximación.
   */
  async detectarPorCoordenada(lat: number, lng: number): Promise<Comunidad | null> {
    const radioMetros = Number(process.env.RADIO_DETECCION_COMUNIDAD_METROS ?? 3000);
    const { rows } = await this.bd.consultar<FilaComunidad & { distancia_metros: number }>(
      `SELECT ${COLUMNAS_COMUNIDAD},
              ST_Distance(centro, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distancia_metros
       FROM comunidades
       WHERE activo = true
       ORDER BY centro <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
       LIMIT 1`,
      [lng, lat],
    );
    const fila = rows[0];
    if (!fila || fila.distancia_metros > radioMetros) return null;
    return aComunidad(fila);
  }

  /**
   * Panel admin — lista los distritos "gestionados": los activos, más los que se apagaron
   * después de haber tenido alguna comunidad (para que sigan viéndose en el panel como
   * "Inactivo" y se puedan reactivar con un clic, en vez de desaparecer y obligar a buscarlos
   * de nuevo en el catálogo completo). Distinto de `buscarDistritos`, que sí busca sobre las
   * ~1892 filas del catálogo UBIGEO completo, activas o nunca tocadas.
   */
  async listarDistritosActivos(): Promise<Distrito[]> {
    const { rows } = await this.bd.consultar<FilaDistrito>(
      `SELECT ${COLUMNAS_DISTRITO} FROM distritos
       WHERE activo = true OR ubigeo IN (SELECT DISTINCT distrito_ubigeo FROM comunidades)
       ORDER BY activo DESC, nombre`,
    );
    return rows.map(aDistrito);
  }

  /** Panel admin: todas las comunidades, activas o no (a diferencia de listarComunidadesActivas). */
  async listarTodasComunidades(): Promise<Comunidad[]> {
    const { rows } = await this.bd.consultar<FilaComunidad>(
      `SELECT ${COLUMNAS_COMUNIDAD} FROM comunidades ORDER BY nombre`,
    );
    return rows.map(aComunidad);
  }

  /**
   * Busca en el catálogo UBIGEO completo (activos e inactivos) para que el super-admin pueda
   * encontrar el distrito que quiere expandir. Sin `q` (o muy corto) no devuelve nada — mostrar
   * las ~1892 filas de una sola vez no tiene sentido para un buscador.
   */
  async buscarDistritos(q: string | undefined): Promise<Distrito[]> {
    if (!q || q.trim().length < 2) return [];
    const { rows } = await this.bd.consultar<FilaDistrito>(
      `SELECT ${COLUMNAS_DISTRITO} FROM distritos WHERE nombre ILIKE $1 OR ubigeo = $2
       ORDER BY activo DESC, nombre LIMIT 20`,
      [`%${q.trim()}%`, q.trim()],
    );
    return rows.map(aDistrito);
  }

  /**
   * "Crear un distrito" en este producto es en realidad activar uno ya existente del catálogo
   * UBIGEO — nunca se inventan ubigeos nuevos (ver docs del doc maestro, sección 5). Expandir a
   * una zona nueva es activar un registro, nunca una migración de esquema.
   */
  async activarDistrito(ubigeo: string): Promise<Distrito> {
    const { rows } = await this.bd.consultar<FilaDistrito>(
      `UPDATE distritos SET activo = true WHERE ubigeo = $1 RETURNING ${COLUMNAS_DISTRITO}`,
      [ubigeo],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un distrito con ubigeo "${ubigeo}"`);
    return aDistrito(rows[0]);
  }

  /**
   * Apaga un distrito — vuelve a quedar oculto para los vecinos, igual que estaba antes de
   * activarlo (nunca se borra la fila: sigue en el catálogo UBIGEO, listo para reactivarse).
   * Exige que ya no tenga ninguna comunidad activa, para no dejar una comunidad "huérfana"
   * visible en la app pero colgando de un distrito apagado.
   */
  async desactivarDistrito(ubigeo: string): Promise<Distrito> {
    await this.obtenerDistritoOFallar(ubigeo);
    const { rows: activas } = await this.bd.consultar(
      "SELECT 1 FROM comunidades WHERE distrito_ubigeo = $1 AND activo = true LIMIT 1",
      [ubigeo],
    );
    if (activas[0]) {
      throw new ConflictException(
        "Este distrito todavía tiene comunidades activas — desactívalas primero.",
      );
    }
    const { rows } = await this.bd.consultar<FilaDistrito>(
      `UPDATE distritos SET activo = false WHERE ubigeo = $1 RETURNING ${COLUMNAS_DISTRITO}`,
      [ubigeo],
    );
    return aDistrito(rows[0]);
  }

  private async obtenerDistritoOFallar(ubigeo: string): Promise<FilaDistrito> {
    const { rows } = await this.bd.consultar<FilaDistrito>(
      `SELECT ${COLUMNAS_DISTRITO} FROM distritos WHERE ubigeo = $1`,
      [ubigeo],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un distrito con ubigeo "${ubigeo}"`);
    return rows[0];
  }

  /** La comunidad nace en el mismo punto que su distrito — el admin puede afinar luego. */
  async crearComunidad(dto: CrearComunidadDto): Promise<Comunidad> {
    const distrito = await this.obtenerDistritoOFallar(dto.distritoUbigeo);
    if (!distrito.activo) {
      throw new ConflictException("El distrito debe estar activo antes de crear una comunidad en él.");
    }

    const slug = slugificar(dto.nombre);
    const id = `com-${slug}`;
    const { rows: existentes } = await this.bd.consultar("SELECT 1 FROM comunidades WHERE id = $1 OR slug = $2", [
      id,
      slug,
    ]);
    if (existentes[0]) {
      throw new ConflictException(`Ya existe una comunidad con el nombre "${dto.nombre}".`);
    }

    await this.bd.consultar(
      `INSERT INTO comunidades (id, distrito_ubigeo, nombre, slug, centro, descripcion, activo, fecha_lanzamiento)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, true, CURRENT_DATE)`,
      [id, dto.distritoUbigeo, dto.nombre, slug, distrito.lng, distrito.lat, dto.descripcion ?? null],
    );

    const { rows } = await this.bd.consultar<FilaComunidad>(`SELECT ${COLUMNAS_COMUNIDAD} FROM comunidades WHERE id = $1`, [
      id,
    ]);
    return aComunidad(rows[0]);
  }

  private async obtenerComunidadOFallar(id: string): Promise<FilaComunidad> {
    const { rows } = await this.bd.consultar<FilaComunidad>(`SELECT ${COLUMNAS_COMUNIDAD} FROM comunidades WHERE id = $1`, [
      id,
    ]);
    if (!rows[0]) throw new NotFoundException(`No existe una comunidad con id "${id}"`);
    return rows[0];
  }

  /** Oculta la comunidad de la app (deja de listarse en GET /comunidades) sin borrar nada. */
  async desactivarComunidad(id: string): Promise<Comunidad> {
    await this.obtenerComunidadOFallar(id);
    const { rows } = await this.bd.consultar<FilaComunidad>(
      `UPDATE comunidades SET activo = false WHERE id = $1 RETURNING ${COLUMNAS_COMUNIDAD}`,
      [id],
    );
    return aComunidad(rows[0]);
  }

  async activarComunidad(id: string): Promise<Comunidad> {
    await this.obtenerComunidadOFallar(id);
    const { rows } = await this.bd.consultar<FilaComunidad>(
      `UPDATE comunidades SET activo = true WHERE id = $1 RETURNING ${COLUMNAS_COMUNIDAD}`,
      [id],
    );
    return aComunidad(rows[0]);
  }

  /**
   * Borra la comunidad de verdad — a diferencia de negocios/avisos/cuentas, acá no hace falta
   * baja lógica: si todavía tiene negocios, avisos o vecinos, la propia FK de la base lo impide
   * (se traduce a un 409 legible) — no hay forma de perder datos reales por accidente.
   */
  async eliminarComunidad(id: string): Promise<void> {
    await this.obtenerComunidadOFallar(id);
    try {
      await this.bd.consultar("DELETE FROM comunidades WHERE id = $1", [id]);
    } catch (error) {
      if (esErrorReferenciado(error)) {
        throw new ConflictException(
          "Esta comunidad todavía tiene negocios, avisos o vecinos registrados — no se puede eliminar.",
        );
      }
      throw error;
    }
  }
}
