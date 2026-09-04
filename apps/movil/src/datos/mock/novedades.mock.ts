import { Novedad } from "@app-vecinos/tipos";

// Cada entrada describe una función real que ya existe en la app — se agrega una línea
// aquí cada vez que se lanza algo nuevo que valga la pena avisarle al vecino. Copia de
// infraestructura/datos-semilla/0001_piloto.sql, para que el modo mock (sin servidor) se vea
// igual que la base de datos real.
export const novedadesMock: Novedad[] = [
  {
    id: "nov-horario-completo",
    titulo: "Ahora puedes ver el horario completo",
    texto: 'Toca "Ver horario completo" en cualquier negocio para ver sus 7 días.',
    publicadoEn: "2026-08-20T00:00:00.000Z",
    activo: true,
  },
  {
    id: "nov-comunidad-muro",
    titulo: "Comunidad ahora es un muro social",
    texto: "Avisos con reacciones y opción de compartir, todo en un solo lugar.",
    publicadoEn: "2026-08-25T00:00:00.000Z",
    activo: true,
  },
];
