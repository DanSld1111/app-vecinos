const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/v1";

export const entorno = {
  apiUrl,
  // Los archivos subidos (fotos de negocio) se sirven fuera del prefijo /v1 — ver
  // app.useStaticAssets() en apps/api/src/main.ts. Para armar la URL completa de una
  // fotoPrincipalUrl (que llega como ruta relativa, ej. "/uploads/negocios/xxx.png") hace
  // falta el origen sin ese prefijo.
  origenApi: apiUrl.replace(/\/v1\/?$/, ""),
} as const;
