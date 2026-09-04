import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { BusquedaService } from "./busqueda.service";

describe("BusquedaService sin Meilisearch configurado (MEILI_HOST/MEILI_MASTER_KEY ausentes)", () => {
  const entornoOriginal = { ...process.env };
  const bdQueNuncaDeberiaLlamarse = {
    consultar: jest.fn(() => {
      throw new Error("no debería llegar a consultar Postgres si no hay índice");
    }),
  } as unknown as BaseDatosService;

  beforeEach(() => {
    delete process.env.MEILI_HOST;
    delete process.env.MEILI_MASTER_KEY;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...entornoOriginal };
  });

  it("buscarNegocios devuelve null (no []) para que quien llama use su respaldo ILIKE", async () => {
    const servicio = new BusquedaService(bdQueNuncaDeberiaLlamarse);
    await expect(servicio.buscarNegocios("pollería", "com-san-borja", 10)).resolves.toBeNull();
  });

  it("reindexarTodo no hace nada (ni toca Postgres) cuando no hay índice configurado", async () => {
    const servicio = new BusquedaService(bdQueNuncaDeberiaLlamarse);
    await expect(servicio.reindexarTodo()).resolves.toBeUndefined();
    expect(bdQueNuncaDeberiaLlamarse.consultar).not.toHaveBeenCalled();
  });

  it("onModuleInit no lanza aunque no haya índice configurado", async () => {
    const servicio = new BusquedaService(bdQueNuncaDeberiaLlamarse);
    await expect(servicio.onModuleInit()).resolves.toBeUndefined();
  });
});
