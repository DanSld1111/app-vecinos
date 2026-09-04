import { codificarCursor, decodificarCursor } from "./paginacion";

describe("codificarCursor / decodificarCursor", () => {
  it("decodifica exactamente lo que se codificó (round-trip)", () => {
    const cursor = { creadoEn: "2026-08-01T00:00:00.000Z", id: "neg-123" };
    expect(decodificarCursor(codificarCursor(cursor))).toEqual(cursor);
  });

  it("undefined (sin cursor, primera página) decodifica a null", () => {
    expect(decodificarCursor(undefined)).toBeNull();
  });

  it("una cadena que no es un cursor válido (no JSON válido en base64url) decodifica a null en vez de lanzar", () => {
    expect(decodificarCursor("esto-no-es-un-cursor")).toBeNull();
  });

  it("un cursor bien formado en base64 pero con forma incorrecta (sin creadoEn/id) decodifica a null", () => {
    const cursorAjeno = Buffer.from(JSON.stringify({ otraCosa: 1 }), "utf8").toString("base64url");
    expect(decodificarCursor(cursorAjeno)).toBeNull();
  });
});
