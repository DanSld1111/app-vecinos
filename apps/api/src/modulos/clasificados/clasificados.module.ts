import { Module } from "@nestjs/common";
import { ClasificadosAdminController, ClasificadosController } from "./clasificados.controller";
import { ClasificadosService } from "./clasificados.service";

@Module({
  controllers: [ClasificadosAdminController, ClasificadosController],
  providers: [ClasificadosService],
  exports: [ClasificadosService],
})
export class ClasificadosModule {}
