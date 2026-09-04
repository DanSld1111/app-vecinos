import { DiaSemana, Horarios } from "@app-vecinos/tipos";

const DIAS: DiaSemana[] = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

export function estaAbiertoAhora(horarios: Horarios, ahora: Date = new Date()): boolean {
  const dia = DIAS[ahora.getDay()];
  const horario = horarios[dia];
  if (horario.cerrado || !horario.abre || !horario.cierra) return false;

  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const [horaAbre, minAbre] = horario.abre.split(":").map(Number);
  const [horaCierra, minCierra] = horario.cierra.split(":").map(Number);

  return minutosAhora >= horaAbre * 60 + minAbre && minutosAhora <= horaCierra * 60 + minCierra;
}

const ORDEN_SEMANA: DiaSemana[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const ABREVIATURA_DIA: Record<DiaSemana, string> = {
  lunes: "L",
  martes: "M",
  miercoles: "M",
  jueves: "J",
  viernes: "V",
  sabado: "S",
  domingo: "D",
};
export const NOMBRE_DIA: Record<DiaSemana, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export interface ResumenDia {
  dia: DiaSemana;
  abreviatura: string;
  abierto: boolean;
  esHoy: boolean;
}

/** Fila de 7 días (lunes a domingo) para mostrar de un vistazo qué días abre el negocio. */
export function resumenSemana(horarios: Horarios, ahora: Date = new Date()): ResumenDia[] {
  const hoy = DIAS[ahora.getDay()];
  return ORDEN_SEMANA.map((dia) => ({
    dia,
    abreviatura: ABREVIATURA_DIA[dia],
    abierto: !horarios[dia].cerrado,
    esHoy: dia === hoy,
  }));
}

/** Busca el próximo día (desde mañana) en que el negocio abre, hasta dar la vuelta a la semana completa. */
function proximaApertura(horarios: Horarios, ahora: Date): { dia: DiaSemana; abre: string } | null {
  for (let i = 1; i <= 7; i++) {
    const indice = (ahora.getDay() + i) % 7;
    const dia = DIAS[indice];
    const horario = horarios[dia];
    if (!horario.cerrado && horario.abre) {
      return { dia, abre: horario.abre };
    }
  }
  return null;
}

/** Estado de hoy en una frase corta: "cierra 20:00", "abre 09:00" o "abre el lunes 09:00". */
export function estadoHoyTexto(horarios: Horarios, ahora: Date = new Date()): { abierto: boolean; detalle: string } {
  const dia = DIAS[ahora.getDay()];
  const horario = horarios[dia];

  if (horario.cerrado || !horario.abre || !horario.cierra) {
    const siguiente = proximaApertura(horarios, ahora);
    if (!siguiente) return { abierto: false, detalle: "Cerrado por ahora" };
    const esMañana = DIAS[(ahora.getDay() + 1) % 7] === siguiente.dia;
    const cuando = esMañana ? "mañana" : `el ${NOMBRE_DIA[siguiente.dia].toLowerCase()}`;
    return { abierto: false, detalle: `abre ${cuando} ${siguiente.abre}` };
  }
  if (estaAbiertoAhora(horarios, ahora)) {
    return { abierto: true, detalle: `cierra ${horario.cierra}` };
  }
  if (ahora.getHours() * 60 + ahora.getMinutes() < timeToMinutos(horario.abre)) {
    return { abierto: false, detalle: `abre hoy ${horario.abre}` };
  }
  const siguiente = proximaApertura(horarios, ahora);
  if (!siguiente) return { abierto: false, detalle: "Cerrado por ahora" };
  const esMañana = DIAS[(ahora.getDay() + 1) % 7] === siguiente.dia;
  const cuando = esMañana ? "mañana" : `el ${NOMBRE_DIA[siguiente.dia].toLowerCase()}`;
  return { abierto: false, detalle: `abre ${cuando} ${siguiente.abre}` };
}

function timeToMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export interface HorarioDiaTexto {
  dia: DiaSemana;
  nombre: string;
  esHoy: boolean;
  texto: string;
}

/** Lista completa lunes-domingo con el horario en texto, para la vista expandida. */
export function listaSemanaCompleta(horarios: Horarios, ahora: Date = new Date()): HorarioDiaTexto[] {
  const hoy = DIAS[ahora.getDay()];
  return ORDEN_SEMANA.map((dia) => {
    const horario = horarios[dia];
    return {
      dia,
      nombre: NOMBRE_DIA[dia],
      esHoy: dia === hoy,
      texto: horario.cerrado || !horario.abre || !horario.cierra ? "Cerrado" : `${horario.abre} – ${horario.cierra}`,
    };
  });
}
