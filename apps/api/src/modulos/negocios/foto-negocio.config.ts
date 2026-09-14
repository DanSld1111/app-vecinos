import { BadRequestException } from "@nestjs/common";
import { memoryStorage } from "multer";

// Buffer en memoria, no disco (ver decisión 0044) — se sube a Supabase Storage vía
// AlmacenamientoService. Render y cualquier host sin disco persistente pierden un
// diskStorage local en cada redeploy; con esto el archivo sobrevive a los redeploys.
export const CARPETA_FOTOS_NEGOCIO = "negocios";

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export const opcionesUploadFotoNegocio = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — generoso para una foto de celular, sin dejar subir cualquier cosa
  fileFilter: (_req: unknown, archivo: Express.Multer.File, callback: (error: Error | null, aceptar: boolean) => void) => {
    if (!TIPOS_PERMITIDOS.has(archivo.mimetype)) {
      callback(new BadRequestException("Solo se aceptan imágenes JPG, PNG o WEBP."), false);
      return;
    }
    callback(null, true);
  },
};
