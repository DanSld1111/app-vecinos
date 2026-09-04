import { Global, Module } from "@nestjs/common";
import { AuditoriaService } from "./auditoria.service";

// @Global(): cualquier módulo que necesite dejar rastro de una acción administrativa lo
// inyecta sin tener que importar este módulo explícitamente — mismo patrón que BaseDatosModule.
@Global()
@Module({
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
