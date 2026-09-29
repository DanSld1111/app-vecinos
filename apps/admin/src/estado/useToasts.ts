import { create } from "zustand";
import { ErrorApi } from "../datos/clienteApi";

/** "exito" = se hizo lo pedido; "error" = no se pudo (no se cierra sola); "info" = pasó algo sin pedirlo. */
export type TipoToast = "exito" | "error" | "info";

export interface Toast {
  id: number;
  tipo: TipoToast;
  titulo: string;
  /** En qué negocio o qué cambió: "Tienda Masutmi · lunes a sábado, 10:00–20:00". */
  detalle?: string;
  /** Solo en errores: vuelve a intentar la misma acción. */
  reintentar?: () => void;
  /** Milisegundos hasta cerrarse sola (los errores no se cierran solos). */
  duracion: number;
}

export type AlertaNueva = Omit<Toast, "id" | "duracion" | "tipo"> & { tipo?: TipoToast; duracion?: number };

let siguienteId = 1;
const MAXIMO_EN_PANTALLA = 4;

interface EstadoToasts {
  toasts: Toast[];
  alertar: (alerta: AlertaNueva) => void;
  /** Forma corta, la de siempre: solo un título. */
  mostrar: (mensaje: string, tipo?: TipoToast) => void;
  cerrar: (id: number) => void;
}

/**
 * Alertas emergentes del panel (decisión 0084): bajan arriba al centro con una animación y dicen
 * qué se hizo y dónde. Las de éxito se cierran solas (PilaToasts pausa el tiempo con el mouse
 * encima); las de error quedan hasta cerrarlas. Nombre "Toast" a propósito, distinto de
 * useAvisos.ts (el store de Avisos vecinales, otra cosa aunque suene parecido).
 */
export const useToasts = create<EstadoToasts>((set) => ({
  toasts: [],
  alertar: ({ tipo = "exito", duracion, ...resto }) => {
    const id = siguienteId++;
    const toast: Toast = { id, tipo, duracion: duracion ?? (tipo === "info" ? 5000 : 4000), ...resto };
    set((estado) => ({ toasts: [toast, ...estado.toasts].slice(0, MAXIMO_EN_PANTALLA) }));
  },
  mostrar: (mensaje, tipo = "exito") => useToasts.getState().alertar({ titulo: mensaje, tipo }),
  cerrar: (id) => set((estado) => ({ toasts: estado.toasts.filter((t) => t.id !== id) })),
}));

/** Atajos para usar desde los stores (fuera de componentes). */
export function alertaExito(titulo: string, detalle?: string) {
  useToasts.getState().alertar({ titulo, detalle });
}

export function alertaInfo(titulo: string, detalle?: string) {
  useToasts.getState().alertar({ tipo: "info", titulo, detalle });
}

/** El detalle de un error: lo que respondió el servidor, o un motivo entendible si no hubo respuesta. */
export function detalleError(error: unknown): string {
  // status 0 = no hubo respuesta: el mensaje de clienteApi habla de "la API", pensado para desarrollo.
  if (error instanceof ErrorApi && error.status !== 0) return error.message;
  return "Revisa tu conexión a internet e intenta de nuevo.";
}

export function alertaError(titulo: string, error?: unknown, reintentar?: () => void) {
  useToasts.getState().alertar({ tipo: "error", titulo, detalle: error === undefined ? undefined : detalleError(error), reintentar });
}
