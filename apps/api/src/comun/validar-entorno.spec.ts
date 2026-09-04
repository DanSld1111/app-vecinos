import { validarEntorno } from "./validar-entorno";

const SECRETO_VALIDO_A = "a".repeat(32);
const SECRETO_VALIDO_B = "b".repeat(32);

describe("validarEntorno", () => {
  const entornoOriginal = { ...process.env };
  let salidaProceso: jest.SpiedFunction<typeof process.exit>;
  let errorConsola: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    // process.exit(1) de verdad tumbaría el propio test runner — se simula como si lanzara,
    // igual que hace Nest en producción cuando el proceso termina.
    salidaProceso = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    errorConsola = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...entornoOriginal };
    jest.restoreAllMocks();
  });

  it("no corta el arranque si ambos secretos son válidos y distintos entre sí", () => {
    process.env.JWT_SECRET = SECRETO_VALIDO_A;
    process.env.JWT_SECRET_VECINO = SECRETO_VALIDO_B;
    expect(() => validarEntorno()).not.toThrow();
    expect(salidaProceso).not.toHaveBeenCalled();
  });

  it("corta el arranque si falta JWT_SECRET", () => {
    delete process.env.JWT_SECRET;
    process.env.JWT_SECRET_VECINO = SECRETO_VALIDO_B;
    expect(() => validarEntorno()).toThrow("process.exit");
    expect(salidaProceso).toHaveBeenCalledWith(1);
  });

  it("corta el arranque si un secreto es más corto que el mínimo", () => {
    process.env.JWT_SECRET = "muy-corto";
    process.env.JWT_SECRET_VECINO = SECRETO_VALIDO_B;
    expect(() => validarEntorno()).toThrow("process.exit");
  });

  it("corta el arranque si un secreto sigue con el valor de repuesto del código fuente", () => {
    process.env.JWT_SECRET = "cambiar-en-produccion";
    process.env.JWT_SECRET_VECINO = SECRETO_VALIDO_B;
    expect(() => validarEntorno()).toThrow("process.exit");
  });

  it("corta el arranque si JWT_SECRET y JWT_SECRET_VECINO son iguales", () => {
    process.env.JWT_SECRET = SECRETO_VALIDO_A;
    process.env.JWT_SECRET_VECINO = SECRETO_VALIDO_A;
    expect(() => validarEntorno()).toThrow("process.exit");
  });

  it("no revienta el proceso real de test: console.error queda mockeado, no imprime al usuario", () => {
    delete process.env.JWT_SECRET;
    process.env.JWT_SECRET_VECINO = SECRETO_VALIDO_B;
    expect(() => validarEntorno()).toThrow();
    expect(errorConsola).toHaveBeenCalled();
  });
});
