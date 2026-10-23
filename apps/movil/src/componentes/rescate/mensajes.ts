import { AvisoMascota, PREGUNTAS_ADOPCION, Padrinazgo, SolicitudAdopcion } from "@app-vecinos/tipos";

/** Los mensajes que la app deja escritos en WhatsApp (decisión 0097): el vecino solo toca Enviar. */

export function mensajeSolicitud(s: SolicitudAdopcion): string {
  const lineas = PREGUNTAS_ADOPCION.map((p) => `• ${p.titulo.replace(/[¿?]/g, "")}: ${(s.respuestas[p.id] ?? "—").toLowerCase()}`);
  return [
    `Hola, ${s.albergueNombre}. Quiero adoptar a *${s.mascotaNombre}* (vi su perfil en ELISUR).`,
    "",
    ...lineas,
    ...(s.motivo ? ["", `Por qué quiero adoptar: ${s.motivo}`] : []),
    "",
    `Mi solicitud en la app: N.º ${s.numero}`,
  ].join("\n");
}

export function mensajePadrinazgo(p: Padrinazgo): string {
  return `Hola, acabo de yapear S/ ${p.monto} para apadrinar a *${p.mascotaNombre}* (ELISUR, padrinazgo N.º ${p.numero}). Te envío la captura.`;
}

export function mensajePista(a: AvisoMascota, lugar: string, esMio: boolean): string {
  const quien = a.nombre || (a.tipo === "perdido" ? "tu mascota" : "la mascota");
  if (esMio) return `Hola, vi tu aviso en ELISUR: creo que ${quien} es mía. ¿Podemos hablar?`;
  return `Hola, vi a ${quien}${lugar ? ` en ${lugar}` : ""} (vi tu aviso en ELISUR).`;
}
