// Mock mínimo para tests: el paquete real ("meilisearch") se publica como ESM puro y Jest
// (CommonJS) no puede requerirlo directo. Los tests de BusquedaService nunca llegan a
// instanciar esta clase (MEILI_HOST/MEILI_MASTER_KEY quedan sin definir a propósito), así
// que ni siquiera hace falta que este mock haga algo — solo tiene que poder importarse.
export class Meilisearch {
  constructor(..._args: unknown[]) {}
}
