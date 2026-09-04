import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Meilisearch } from "meilisearch";
import { Negocio } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";

interface FilaNegocioParaIndice {
  id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  comunidad_id: string;
  distrito_ubigeo: string;
  categoria_ids: string[];
}

interface DocumentoNegocio {
  id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  comunidadId: string;
  distritoUbigeo: string;
  categoriaIds: string[];
}

/**
 * Índice de búsqueda de negocios (Meilisearch) — ver docs/decisiones/0018-indice-de-busqueda.md.
 *
 * Diseñado para que la ausencia o caída de Meilisearch NUNCA rompa la app: si `MEILI_HOST`/
 * `MEILI_MASTER_KEY` no están configurados, o el servidor no responde, todos los métodos
 * devuelven `null` (en vez de lanzar) y quien llama (NegociosService.buscar) cae de vuelta al
 * `ILIKE` directo contra Postgres que ya existía antes de esto — se pierde tolerancia a errores
 * de tipeo y relevancia, pero la búsqueda nunca deja de funcionar.
 */
@Injectable()
export class BusquedaService implements OnModuleInit {
  private readonly logger = new Logger(BusquedaService.name);
  private readonly cliente: Meilisearch | null;

  constructor(private readonly bd: BaseDatosService) {
    const host = process.env.MEILI_HOST;
    const apiKey = process.env.MEILI_MASTER_KEY;
    this.cliente = host && apiKey ? new Meilisearch({ host, apiKey }) : null;
    if (!this.cliente) {
      this.logger.warn(
        "MEILI_HOST/MEILI_MASTER_KEY no configurados — la búsqueda de negocios usará ILIKE directo a Postgres, sin índice.",
      );
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.cliente) return;
    try {
      const indice = this.cliente.index("negocios");
      await indice.updateSettings({
        searchableAttributes: ["nombre", "descripcion", "direccion"],
        filterableAttributes: ["comunidadId", "categoriaIds"],
      });
      await this.reindexarTodo();
      this.logger.log("Índice de negocios listo en Meilisearch.");
    } catch (error) {
      this.logger.warn(
        `No se pudo conectar a Meilisearch al arrancar (${(error as Error).message}) — se sigue sin índice, con ILIKE de respaldo.`,
      );
    }
  }

  /**
   * Recarga el índice completo desde Postgres — se usa al arrancar y sirve para reparar el
   * índice si se desincroniza. Primero borra todo el contenido del índice: si solo se
   * agregaran los negocios activos actuales, cualquier documento huérfano (de un negocio que
   * dejó de ser público por un cambio hecho fuera de la API normal, ej. restaurar la base desde
   * una semilla) se quedaría enterrado en el índice para siempre — Postgres sigue filtrando
   * por estado al resolver una búsqueda, así que nunca se ve un resultado incorrecto, pero el
   * índice queda con basura que crece con el tiempo sin este borrado previo.
   */
  async reindexarTodo(): Promise<void> {
    if (!this.cliente) return;
    await this.cliente.index("negocios").deleteAllDocuments();
    const { rows } = await this.bd.consultar<FilaNegocioParaIndice>(
      `SELECT n.id, n.nombre, n.descripcion, n.direccion, n.comunidad_id, n.distrito_ubigeo,
              COALESCE(array_agg(nc.categoria_id) FILTER (WHERE nc.categoria_id IS NOT NULL), '{}') AS categoria_ids
       FROM negocios n
       LEFT JOIN negocio_categorias nc ON nc.negocio_id = n.id
       WHERE n.estado = 'activo'
       GROUP BY n.id`,
    );
    const documentos: DocumentoNegocio[] = rows.map((fila) => ({
      id: fila.id,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      direccion: fila.direccion,
      comunidadId: fila.comunidad_id,
      distritoUbigeo: fila.distrito_ubigeo,
      categoriaIds: fila.categoria_ids,
    }));
    await this.cliente.index("negocios").addDocuments(documentos, { primaryKey: "id" });
  }

  /**
   * Se llama después de crear/aprobar/rechazar/editar un negocio. Si ya no es público (no
   * "activo"), se saca del índice; si sí, se actualiza con los datos nuevos. Nunca lanza —
   * un fallo acá no debe tumbar la operación real (crear/editar) que sí importa.
   */
  async sincronizarNegocio(negocio: Negocio): Promise<void> {
    if (!this.cliente) return;
    try {
      const indice = this.cliente.index("negocios");
      if (negocio.estado !== "activo") {
        await indice.deleteDocument(negocio.id).catch(() => undefined); // ya puede no estar indexado
        return;
      }
      const documento: DocumentoNegocio = {
        id: negocio.id,
        nombre: negocio.nombre,
        descripcion: negocio.descripcion,
        direccion: negocio.direccion,
        comunidadId: negocio.comunidadId,
        distritoUbigeo: negocio.distritoUbigeo,
        categoriaIds: negocio.categoriaIds,
      };
      await indice.addDocuments([documento], { primaryKey: "id" });
    } catch (error) {
      this.logger.warn(`No se pudo sincronizar el negocio "${negocio.id}" con el índice: ${(error as Error).message}`);
    }
  }

  /**
   * Ids en orden de relevancia, o `null` si el índice no está disponible — en ese caso quien
   * llama debe usar su propio respaldo (ILIKE). Array vacío (no null) significa "el índice
   * respondió pero no encontró nada", una respuesta real, no una falla.
   */
  async buscarNegocios(query: string, comunidadId: string, limite: number): Promise<string[] | null> {
    if (!this.cliente) return null;
    try {
      const resultado = await this.cliente.index("negocios").search(query, {
        filter: `comunidadId = ${JSON.stringify(comunidadId)}`,
        limit: limite,
      });
      return resultado.hits.map((hit) => hit.id);
    } catch (error) {
      this.logger.warn(`Falla al consultar el índice de negocios, se usa Postgres como respaldo: ${(error as Error).message}`);
      return null;
    }
  }
}
