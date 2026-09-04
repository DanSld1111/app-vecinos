import { DiaSemana, Horarios } from "@app-vecinos/tipos";

const DIAS_POR_INDICE: DiaSemana[] = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

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

function minutosDeHora(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function estaAbiertoAhora(horarios: Horarios, ahora: Date = new Date()): boolean {
  const dia = DIAS_POR_INDICE[ahora.getDay()];
  const horario = horarios[dia];
  if (horario.cerrado || !horario.abre || !horario.cierra) return false;

  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  return minutosAhora >= minutosDeHora(horario.abre) && minutosAhora <= minutosDeHora(horario.cierra);
}

function proximaApertura(horarios: Horarios, ahora: Date): { dia: DiaSemana; abre: string } | null {
  for (let i = 1; i <= 7; i++) {
    const indice = (ahora.getDay() + i) % 7;
    const dia = DIAS_POR_INDICE[indice];
    const horario = horarios[dia];
    if (!horario.cerrado && horario.abre) return { dia, abre: horario.abre };
  }
  return null;
}

/** Estado de hoy en una frase corta, sin el prefijo "Abierto/Cerrado" (eso lo decide quien lo consume). */
export function estadoHoyTexto(horarios: Horarios, ahora: Date = new Date()): { abierto: boolean; detalle: string } {
  const dia = DIAS_POR_INDICE[ahora.getDay()];
  const horario = horarios[dia];

  if (horario.cerrado || !horario.abre || !horario.cierra) {
    const siguiente = proximaApertura(horarios, ahora);
    if (!siguiente) return { abierto: false, detalle: "Cerrado por ahora" };
    const esManana = DIAS_POR_INDICE[(ahora.getDay() + 1) % 7] === siguiente.dia;
    const cuando = esManana ? "mañana" : `el ${NOMBRE_DIA[siguiente.dia].toLowerCase()}`;
    return { abierto: false, detalle: `Abre ${cuando} ${siguiente.abre}` };
  }
  if (estaAbiertoAhora(horarios, ahora)) {
    return { abierto: true, detalle: `cierra ${horario.cierra}` };
  }
  if (ahora.getHours() * 60 + ahora.getMinutes() < minutosDeHora(horario.abre)) {
    return { abierto: false, detalle: `Abre hoy ${horario.abre}` };
  }
  const siguiente = proximaApertura(horarios, ahora);
  if (!siguiente) return { abierto: false, detalle: "Cerrado por ahora" };
  const esManana = DIAS_POR_INDICE[(ahora.getDay() + 1) % 7] === siguiente.dia;
  const cuando = esManana ? "mañana" : `el ${NOMBRE_DIA[siguiente.dia].toLowerCase()}`;
  return { abierto: false, detalle: `Abre ${cuando} ${siguiente.abre}` };
}

export interface ResumenDia {
  dia: DiaSemana;
  abreviatura: string;
  abierto: boolean;
  esHoy: boolean;
}

export function resumenSemana(horarios: Horarios, ahora: Date = new Date()): ResumenDia[] {
  const hoy = DIAS_POR_INDICE[ahora.getDay()];
  return ORDEN_SEMANA.map((dia) => ({
    dia,
    abreviatura: ABREVIATURA_DIA[dia],
    abierto: !horarios[dia].cerrado,
    esHoy: dia === hoy,
  }));
}

export interface HorarioDiaTexto {
  dia: DiaSemana;
  nombre: string;
  esHoy: boolean;
  texto: string;
}

export function listaSemanaCompleta(horarios: Horarios, ahora: Date = new Date()): HorarioDiaTexto[] {
  const hoy = DIAS_POR_INDICE[ahora.getDay()];
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
