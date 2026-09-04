export type FuenteDeDatos = "mock" | "api";

const fuenteDeDatos = (process.env.EXPO_PUBLIC_DATA_SOURCE as FuenteDeDatos) ?? "mock";
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/v1";

export const entorno = {
  fuenteDeDatos,
  apiUrl,
  // Los archivos subidos (fotos de negocio, fotos de servicio) se sirven fuera del prefijo
  // /v1 — ver app.useStaticAssets() en apps/api/src/main.ts. El servidor los devuelve como
  // ruta relativa (ej. "/uploads/negocios/xxx.jpg"); para mostrarlos hace falta anteponer
  // este origen. Ver src/utilidades/media.ts.
  origenApi: apiUrl.replace(/\/v1\/?$/, ""),
  comunidadPorDefectoSlug: "san-borja",
} as const;
