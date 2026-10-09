import { randomUUID } from "crypto";
import { Injectable, Logger } from "@nestjs/common";

// Reemplaza el disco local (ver decisión 0044): Render y cualquier host sin disco
// persistente pierden `apps/api/uploads/` en cada redeploy. Supabase Storage guarda el
// archivo real; la base de datos sigue guardando solo la URL pública, igual que antes con
// rutas locales — el resto del código no se entera de dónde vive el archivo.
@Injectable()
export class AlmacenamientoService {
  private readonly logger = new Logger(AlmacenamientoService.name);
  private readonly urlBase = process.env.SUPABASE_URL;
  private readonly claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  private readonly bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";

  private verificarConfigurado(): void {
    if (!this.urlBase || !this.claveServicio) {
      throw new Error("Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para subir archivos.");
    }
  }

  async subir(carpeta: string, buffer: Buffer, nombreOriginal: string, contentType: string): Promise<string> {
    this.verificarConfigurado();
    const extension = nombreOriginal.includes(".") ? nombreOriginal.slice(nombreOriginal.lastIndexOf(".")) : "";
    const ruta = `${carpeta}/${randomUUID()}${extension.toLowerCase()}`;

    const respuesta = await fetch(`${this.urlBase}/storage/v1/object/${this.bucket}/${ruta}`, {
      method: "POST",
      headers: {
        apikey: this.claveServicio as string,
        Authorization: `Bearer ${this.claveServicio}`,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: buffer,
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      throw new Error(`No se pudo subir el archivo a Supabase Storage (${respuesta.status}): ${detalle}`);
    }

    return `${this.urlBase}/storage/v1/object/public/${this.bucket}/${ruta}`;
  }

  /**
   * Permiso de un solo uso para que el navegador suba un archivo grande (un video) directo a
   * Supabase Storage, sin pasar por esta API (Render corta las peticiones largas y pesadas).
   * El navegador hace PUT a `urlSubida` con el archivo; al terminar, el archivo queda en
   * `urlPublica`. Ver docs/decisiones/0091.
   */
  async firmarSubida(carpeta: string, nombreOriginal: string): Promise<{ urlSubida: string; urlPublica: string }> {
    this.verificarConfigurado();
    const extension = nombreOriginal.includes(".") ? nombreOriginal.slice(nombreOriginal.lastIndexOf(".")).toLowerCase() : "";
    const ruta = `${carpeta}/${randomUUID()}${extension}`;
    const respuesta = await fetch(`${this.urlBase}/storage/v1/object/upload/sign/${this.bucket}/${ruta}`, {
      method: "POST",
      headers: {
        apikey: this.claveServicio as string,
        Authorization: `Bearer ${this.claveServicio}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      throw new Error(`No se pudo preparar la subida en Supabase Storage (${respuesta.status}): ${detalle}`);
    }
    const { url } = (await respuesta.json()) as { url: string };
    return {
      urlSubida: `${this.urlBase}/storage/v1${url}`,
      urlPublica: `${this.urlBase}/storage/v1/object/public/${this.bucket}/${ruta}`,
    };
  }

  /** Si la URL es de un archivo subido a nuestro propio almacenamiento (y no un enlace externo). */
  esPropia(url: string | null | undefined): boolean {
    return Boolean(url && this.urlBase && url.startsWith(`${this.urlBase}/storage/v1/object/public/${this.bucket}/`));
  }

  async eliminarPorUrl(url: string | null | undefined): Promise<void> {
    if (!url || !this.urlBase || !url.startsWith(`${this.urlBase}/storage/v1/object/public/${this.bucket}/`)) return;
    const ruta = url.slice(`${this.urlBase}/storage/v1/object/public/${this.bucket}/`.length);
    try {
      const respuesta = await fetch(`${this.urlBase}/storage/v1/object/${this.bucket}/${ruta}`, {
        method: "DELETE",
        headers: { apikey: this.claveServicio as string, Authorization: `Bearer ${this.claveServicio}` },
      });
      if (!respuesta.ok) {
        this.logger.warn(`No se pudo borrar ${ruta} de Supabase Storage (${respuesta.status}) — no es un error fatal.`);
      }
    } catch (error) {
      this.logger.warn(`No se pudo borrar ${ruta} de Supabase Storage: ${(error as Error).message}`);
    }
  }
}
