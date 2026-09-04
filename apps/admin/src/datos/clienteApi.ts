import { entorno } from "../config/entorno";

interface Opciones {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  token?: string | null;
}

export class ErrorApi extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Se registra desde useSesionAdmin.ts (no se importa acá para evitar un ciclo:
 * useSesionAdmin.ts ya importa apiFetch de este archivo). Ver
 * docs/decisiones/0021-endurecimiento-post-diagnostico.md — antes un token vencido/anulado
 * a mitad de sesión solo se veía como un error genérico de "no se pudo completar la
 * solicitud", sin cerrar sesión ni avisar que había que volver a ingresar.
 */
let alSesionExpirada: (() => void) | null = null;
export function registrarManejadorSesionExpirada(fn: () => void): void {
  alSesionExpirada = fn;
}

export async function apiFetch<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${entorno.apiUrl}${ruta}`, {
      method: opciones.metodo ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {}),
      },
      body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi("No pudimos conectarnos al servidor. Revisa que la API esté corriendo.", 0);
  }

  if (respuesta.status === 204) return undefined as T;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    // Un 401 en una petición que SÍ llevaba token significa que el token dejó de ser válido
    // (expiró, o la cuenta se desactivó/eliminó a mitad de sesión) — distinto de un 401 en el
    // propio login (sin token todavía), que es simplemente "correo o contraseña incorrectos".
    if (respuesta.status === 401 && opciones.token) {
      alSesionExpirada?.();
    }
    const mensaje = Array.isArray(datos?.message) ? datos.message[0] : datos?.message;
    throw new ErrorApi(mensaje ?? "No se pudo completar la solicitud.", respuesta.status);
  }
  return datos as T;
}

/**
 * Para las pocas rutas que suben un archivo (multipart/form-data) en vez de JSON — hoy solo
 * la foto de negocio. Aparte de apiFetch porque acá NO hay que fijar Content-Type: el browser
 * arma el boundary del multipart solo si uno lo deja poner la cabecera automáticamente. Ver
 * docs/decisiones/0021-endurecimiento-post-diagnostico.md.
 */
export async function apiSubirArchivo<T>(ruta: string, archivo: File, token: string): Promise<T> {
  const cuerpo = new FormData();
  cuerpo.append("foto", archivo);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${entorno.apiUrl}${ruta}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: cuerpo,
    });
  } catch {
    throw new ErrorApi("No pudimos conectarnos al servidor. Revisa que la API esté corriendo.", 0);
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    if (respuesta.status === 401) alSesionExpirada?.();
    const mensaje = Array.isArray(datos?.message) ? datos.message[0] : datos?.message;
    throw new ErrorApi(mensaje ?? "No se pudo subir el archivo.", respuesta.status);
  }
  return datos as T;
}
