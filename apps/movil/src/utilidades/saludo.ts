export function saludoSegunHora(fecha: Date = new Date()): string {
  const hora = fecha.getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "jueves 28" — la fecha que acompaña al nombre de la comunidad arriba de Inicio. */
export function fechaCorta(fecha: Date = new Date()): string {
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()}`;
}
