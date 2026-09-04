import { Module } from "@nestjs/common";
import { BusquedaService } from "./busqueda.service";

// BaseDatosService (que este módulo necesita) ya es @Global() vía BaseDatosModule en
// app.module.ts — no hace falta importarlo de nuevo acá.
@Module({
  providers: [BusquedaService],
  exports: [BusquedaService],
})
export class BusquedaModule {}
