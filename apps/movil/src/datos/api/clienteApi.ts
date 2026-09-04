import { Platform } from "react-native";
import { entorno } from "../../config/entorno";

/** Lo mínimo que necesitamos de un ImagePickerAsset (expo-image-picker) — no importamos el
 * paquete acá para no acoplar este módulo genérico a esa librería. */
export interface ArchivoImagen {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  /** Solo viene en web (expo-image-picker ya entrega el File real ahí) — en nativo se arma
   * el objeto { uri, name, type } que React Native sabe subir directo desde el uri local. */
  file?: File;
}

export class ErrorApi extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function aQueryString(parametros: Record<string, string | number | undefined>): string {
  const filtrados = Object.entries(parametros).filter(([, v]) => v !== undefined) as [string, string | number][];
  if (filtrados.length === 0) return "";
  return "?" + filtrados.map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(valor)}`).join("&");
}

export async function apiGet<T>(ruta: string, parametros: Record<string, string | number | undefined> = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${entorno.apiUrl}${ruta}${aQueryString(parametros)}`);
  } catch {
    throw new ErrorApi("No pudimos conectarnos al servidor.", 0);
  }

  if (respuesta.status === 404) return null as T;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const mensaje = Array.isArray(datos?.message) ? datos.message[0] : datos?.message;
    throw new ErrorApi(mensaje ?? "No se pudo completar la solicitud.", respuesta.status);
  }
  return datos as T;
}

interface OpcionesFetch {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  token?: string | null;
}

/**
 * Dos sistemas de sesión distintos comparten este mismo `apiFetch` (vecino y "modo gestión" de
 * dueño de negocio/junta vecinal) — cada uno se registra acá y recibe el token que se usó en
 * la petición que falló, para decidir si es SU sesión la que venció (comparándolo contra el
 * token que tiene guardado) antes de cerrarla. Así un 401 del token de vecino nunca cierra por
 * error la sesión de gestión, ni viceversa. Ver docs/decisiones/0021-endurecimiento-post-diagnostico.md.
 */
const manejadoresSesionExpirada: Array<(tokenUsado: string) => void> = [];
export function registrarManejadorSesionExpirada(fn: (tokenUsado: string) => void): void {
  manejadoresSesionExpirada.push(fn);
}

/**
 * Para las rutas que necesitan cuerpo/método/token (el "modo gestión" de dueño de
 * negocio y junta vecinal) — `apiGet` de arriba solo cubre lecturas públicas.
 */
export async function apiFetch<T>(ruta: string, opciones: OpcionesFetch = {}): Promise<T> {
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
    throw new ErrorApi("No pudimos conectarnos al servidor.", 0);
  }

  if (respuesta.status === 204) return undefined as T;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    if (respuesta.status === 401 && opciones.token) {
      for (const manejador of manejadoresSesionExpirada) manejador(opciones.token);
    }
    const mensaje = Array.isArray(datos?.message) ? datos.message[0] : datos?.message;
    throw new ErrorApi(mensaje ?? "No se pudo completar la solicitud.", respuesta.status);
  }
  return datos as T;
}

/**
 * Para las rutas que suben una foto (multipart/form-data) — "modo gestión" de dueño de negocio
 * (foto principal, galería, foto de producto). NO fijar Content-Type: el runtime arma el
 * boundary del multipart solo si se lo deja poner la cabecera automáticamente (mismo criterio
 * que apps/admin/src/datos/clienteApi.ts::apiSubirArchivo).
 */
export async function apiSubirArchivo<T>(ruta: string, archivo: ArchivoImagen, token: string): Promise<T> {
  const nombreArchivo = archivo.fileName ?? "foto.jpg";
  const cuerpo = new FormData();
  if (Platform.OS === "web" && archivo.file) {
    cuerpo.append("foto", archivo.file, nombreArchivo);
  } else {
    // React Native entiende este objeto { uri, name, type } y lo sube directo desde el
    // archivo local — no hace falta leerlo a memoria primero.
    cuerpo.append("foto", {
      uri: archivo.uri,
      name: nombreArchivo,
      type: archivo.mimeType ?? "image/jpeg",
    } as unknown as Blob);
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${entorno.apiUrl}${ruta}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: cuerpo,
    });
  } catch {
    throw new ErrorApi("No pudimos conectarnos al servidor.", 0);
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      for (const manejador of manejadoresSesionExpirada) manejador(token);
    }
    const mensaje = Array.isArray(datos?.message) ? datos.message[0] : datos?.message;
    throw new ErrorApi(mensaje ?? "No se pudo subir la foto.", respuesta.status);
  }
  return datos as T;
}
