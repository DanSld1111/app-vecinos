/** Deja solo dígitos y corta a 9 — el largo de un celular peruano, que es lo único que se pide. */
export function soloDigitos(texto: string, maxLen = 9): string {
  return texto.replace(/\D/g, "").slice(0, maxLen);
}
