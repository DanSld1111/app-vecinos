export function tiempoRelativo(fechaIso: string, ahora = new Date()): string {
  // `fechaIso` ya es un timestamp completo (TIMESTAMPTZ de la base, ej. "2026-08-28T09:00:00.000Z")
  // — antes se le concatenaba "T00:00:00", que solo tenía sentido para una fecha sin hora y acá
  // producía un string inválido (dos "T"), de ahí el "Hace NaN semanas" en cualquier aviso real.
  const fecha = new Date(fechaIso);
  const dias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));

  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;

  const semanas = Math.floor(dias / 7);
  if (semanas === 1) return "Hace 1 semana";
  return `Hace ${semanas} semanas`;
}
