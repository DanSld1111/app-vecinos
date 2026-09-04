/**
 * Paginación por keyset (creadoEn, id) — nunca offset, para que la página siga siendo
 * estable aunque se inserten filas nuevas mientras el vecino sigue haciendo scroll
 * (regla de la sección 7.2 del doc maestro: ningún listado se devuelve completo).
 */
export interface CursorNegocios {
  creadoEn: string;
  id: string;
}

export function codificarCursor(cursor: CursorNegocios): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodificarCursor(cursor: string | undefined): CursorNegocios | null {
  if (!cursor) return null;
  try {
    const datos = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof datos.creadoEn === "string" && typeof datos.id === "string") {
      return datos;
    }
    return null;
  } catch {
    return null;
  }
}
