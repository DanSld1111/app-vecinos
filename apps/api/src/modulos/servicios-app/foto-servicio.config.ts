import { BadRequestException } from "@nestjs/common";
import { memoryStorage } from "multer";

// Mismo patrón que foto-negocio.config.ts (apps/api/src/modulos/negocios/) — ver ese archivo
// para el porqué de Supabase Storage en vez de disco local.
export const CARPETA_FOTOS_SERVICIO = "servicios";

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export const opcionesUploadFotoServicio = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: unknown, archivo: Express.Multer.File, callback: (error: Error | null, aceptar: boolean) => void) => {
    if (!TIPOS_PERMITIDOS.has(archivo.mimetype)) {
      callback(new BadRequestException("Solo se aceptan imágenes JPG, PNG o WEBP."), false);
      return;
    }
    callback(null, true);
  },
};
