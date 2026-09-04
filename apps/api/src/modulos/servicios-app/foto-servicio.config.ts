import { randomUUID } from "crypto";
import { extname, join } from "path";
import { BadRequestException } from "@nestjs/common";
import { diskStorage } from "multer";

// Mismo criterio que foto-negocio.config.ts (apps/api/src/modulos/negocios/) — almacenamiento
// local de paso, reemplazable por un CDN sin que el resto del código se entere.
export const DIRECTORIO_FOTOS_SERVICIO = join(__dirname, "..", "..", "..", "uploads", "servicios");

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export const opcionesUploadFotoServicio = {
  storage: diskStorage({
    destination: DIRECTORIO_FOTOS_SERVICIO,
    filename: (_req, archivo, callback) => {
      callback(null, `${randomUUID()}${extname(archivo.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: unknown, archivo: Express.Multer.File, callback: (error: Error | null, aceptar: boolean) => void) => {
    if (!TIPOS_PERMITIDOS.has(archivo.mimetype)) {
      callback(new BadRequestException("Solo se aceptan imágenes JPG, PNG o WEBP."), false);
      return;
    }
    callback(null, true);
  },
};
