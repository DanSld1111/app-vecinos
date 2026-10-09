import { Module } from "@nestjs/common";
import { ModulosController, ParaTiAdminController, ParaTiController } from "./para-ti.controller";
import { ParaTiService } from "./para-ti.service";

/** "Para ti" y los módulos de la app que se encienden y apagan. Ver docs/decisiones/0091. */
@Module({
  controllers: [ModulosController, ParaTiController, ParaTiAdminController],
  providers: [ParaTiService],
})
export class ParaTiModule {}
