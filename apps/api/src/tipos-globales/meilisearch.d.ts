/**
 * El paquete `meilisearch` solo publica sus tipos vía "exports" en su package.json (sin
 * "types"/"main" de nivel superior) — con `moduleResolution: "node"` (clásica) del resto de
 * `apps/api`, TypeScript no logra encontrarlos. Cambiar `moduleResolution` a "node16"/"bundler"
 * para todo el proyecto por una sola dependencia es un cambio de alcance mucho mayor (afecta
 * cómo se resuelven TODOS los imports del backend), así que en vez de eso se declara acá,
 * a mano, únicamente la forma que este proyecto realmente usa de la librería.
 */
declare module "meilisearch" {
  interface OpcionesBusqueda {
    filter?: string | string[];
    limit?: number;
  }

  interface ResultadoHit {
    id: string;
    [clave: string]: unknown;
  }

  interface ResultadoBusqueda {
    hits: ResultadoHit[];
  }

  interface OpcionesDocumentos {
    primaryKey?: string;
  }

  interface Indice {
    search(query: string, opciones?: OpcionesBusqueda): Promise<ResultadoBusqueda>;
    addDocuments(documentos: unknown[], opciones?: OpcionesDocumentos): Promise<unknown>;
    deleteDocument(id: string): Promise<unknown>;
    deleteAllDocuments(): Promise<unknown>;
    updateSettings(config: {
      searchableAttributes?: string[];
      filterableAttributes?: string[];
    }): Promise<unknown>;
  }

  export class Meilisearch {
    constructor(opciones: { host: string; apiKey?: string });
    index(nombre: string): Indice;
  }
}
