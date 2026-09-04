import { Injectable, Logger } from "@nestjs/common";
import { BaseDatosService } from "../base-datos/base-datos.service";

interface FilaTokenVecino {
  push_token: string;
}

/**
 * Envío de push reales vía la API de Expo (https://exp.host/--/api/v2/push/send) — no requiere
 * credenciales propias, cualquier proyecto Expo puede usarla directo con los "Expo push tokens"
 * que cada celular registra (ver useNotificaciones.ts en apps/movil). Documentado en
 * docs/decisiones/0021-endurecimiento-post-diagnostico.md.
 *
 * Igual que AuditoriaService: nunca debe tumbar la acción real (aprobar un aviso) si el envío
 * falla — todo error queda en log, nunca se relanza.
 */
@Injectable()
export class NotificacionesPushService {
  private readonly logger = new Logger(NotificacionesPushService.name);

  constructor(private readonly bd: BaseDatosService) {}

  /** Notifica a los vecinos de una comunidad que tienen push activado y token registrado. */
  async notificarComunidad(comunidadId: string, titulo: string, cuerpo: string): Promise<void> {
    try {
      const { rows } = await this.bd.consultar<FilaTokenVecino>(
        `SELECT push_token FROM usuarios_app
         WHERE comunidad_id = $1 AND eliminado_en IS NULL AND estado = 'activo' AND push_token IS NOT NULL`,
        [comunidadId],
      );
      if (rows.length === 0) return;

      const mensajes = rows.map((fila) => ({
        to: fila.push_token,
        title: titulo,
        body: cuerpo,
        sound: "default",
      }));

      // La API de Expo acepta hasta 100 mensajes por request — en el volumen actual del
      // piloto (una sola comunidad) nunca se acerca a ese límite, pero se trocea igual por
      // si crece.
      for (let i = 0; i < mensajes.length; i += 100) {
        const lote = mensajes.slice(i, i + 100);
        const respuesta = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(lote),
        });
        if (!respuesta.ok) {
          this.logger.warn(`Expo push respondió ${respuesta.status} al notificar comunidad ${comunidadId}`);
        }
      }
    } catch (error) {
      this.logger.warn(`No se pudo enviar la notificación push (comunidad ${comunidadId}): ${error}`);
    }
  }

  /** Guarda (o borra, con token null) el token de push de un vecino. */
  async guardarToken(usuarioId: string, pushToken: string | null): Promise<void> {
    await this.bd.consultar(`UPDATE usuarios_app SET push_token = $2 WHERE id = $1 AND eliminado_en IS NULL`, [
      usuarioId,
      pushToken,
    ]);
  }
}
