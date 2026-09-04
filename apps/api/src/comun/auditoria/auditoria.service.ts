import { Injectable, Logger } from "@nestjs/common";
import { BaseDatosService } from "../base-datos/base-datos.service";

/**
 * Registro de qué cuenta hizo qué acción sobre qué entidad — antes solo existía
 * `validado_por_cuenta_id` (aprobar/rechazar de negocios y avisos), sin rastro de crear,
 * eliminar, ni de las acciones de otros módulos. Ver docs/decisiones/0021-endurecimiento-post-diagnostico.md.
 *
 * A propósito nunca lanza: registrar una auditoría es secundario a la acción real que
 * disparó el registro (aprobar un negocio, eliminar una cuenta...) — si la auditoría fallara
 * y tumbara la operación principal, sería peor el remedio que la enfermedad.
 */
@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly bd: BaseDatosService) {}

  async registrar(
    accion: string,
    entidad: string,
    entidadId: string,
    cuentaId: string | null,
    detalle?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.bd.consultar(
        `INSERT INTO auditoria (accion, entidad, entidad_id, cuenta_id, detalle) VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [accion, entidad, entidadId, cuentaId, detalle ? JSON.stringify(detalle) : null],
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo registrar auditoría (${accion} ${entidad} ${entidadId}): ${(error as Error).message}`,
      );
    }
  }
}
