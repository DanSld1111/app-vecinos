import { Cuenta } from "@app-vecinos/tipos";
import { dentroDelAlcance } from "./alcance";

function cuenta(distritosAsignados: string[]): Cuenta {
  return {
    id: "cuenta-1",
    nombre: "Prueba",
    correo: "prueba@elisur.app",
    rol: "validador_contenido",
    negocioIds: [],
    distritosAsignados,
    activo: true,
    creadoEn: "2026-01-01T00:00:00.000Z",
    ultimoAccesoEn: null,
  };
}

describe("dentroDelAlcance", () => {
  it("sin distritos asignados: cualquier ubigeo está dentro del alcance", () => {
    expect(dentroDelAlcance(cuenta([]), "150140")).toBe(true);
    expect(dentroDelAlcance(cuenta([]), "999999")).toBe(true);
  });

  it("con distritos asignados: solo los incluidos en la lista están dentro del alcance", () => {
    const cuentaAcotada = cuenta(["150140", "150122"]);
    expect(dentroDelAlcance(cuentaAcotada, "150140")).toBe(true);
    expect(dentroDelAlcance(cuentaAcotada, "150122")).toBe(true);
    expect(dentroDelAlcance(cuentaAcotada, "150131")).toBe(false);
  });
});
