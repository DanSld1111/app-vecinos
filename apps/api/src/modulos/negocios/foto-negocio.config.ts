import { randomUUID } from "crypto";
import { extname, join } from "path";
import { BadRequestException } from "@nestjs/common";
import { diskStorage } from "multer";

// Almacenamiento local en disco — no hay CDN todavía (Cloudflare Images sigue en
// docs/tecnica/10-fases-pendientes.pdf, Etapa 4). Es un punto de partida real y funcional
// para el piloto: cuando exista CDN, solo cambia esta configuración, el resto del código
// (columna foto_principal_url con una URL) no se entera de dónde vive el archivo.
export const DIRECTORIO_FOTOS_NEGOCIO = join(__dirname, "..", "..", "..", "uploads", "negocios");

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export const opcionesUploadFotoNegocio = {
  storage: diskStorage({
    destination: DIRECTORIO_FOTOS_NEGOCIO,
    filename: (_req, archivo, callback) => {
      callback(null, `${randomUUID()}${extname(archivo.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — generoso para una foto de celular, sin dejar subir cualquier cosa
  fileFilter: (_req: unknown, archivo: Express.Multer.File, callback: (error: Error | null, aceptar: boolean) => void) => {
    if (!TIPOS_PERMITIDOS.has(archivo.mimetype)) {
      callback(new BadRequestException("Solo se aceptan imágenes JPG, PNG o WEBP."), false);
      return;
    }
    callback(null, true);
  },
};
