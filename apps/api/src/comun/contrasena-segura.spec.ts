import { REGEX_CONTRASENA_SEGURA } from "./contrasena-segura";

function esSegura(contrasena: string): boolean {
  return REGEX_CONTRASENA_SEGURA.test(contrasena);
}

describe("REGEX_CONTRASENA_SEGURA", () => {
  it("acepta una contraseña con mayúscula, número, carácter especial y 8+ caracteres", () => {
    expect(esSegura("Elisur2026!")).toBe(true);
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    expect(esSegura("Ab1!")).toBe(false);
  });

  it("rechaza una contraseña sin mayúscula", () => {
    expect(esSegura("elisur2026!")).toBe(false);
  });

  it("rechaza una contraseña sin número", () => {
    expect(esSegura("Elisurpiloto!")).toBe(false);
  });

  it("rechaza una contraseña sin carácter especial", () => {
    expect(esSegura("Elisur2026")).toBe(false);
  });

  it("rechaza una contraseña vacía", () => {
    expect(esSegura("")).toBe(false);
  });
});
