import { Module } from "@nestjs/common";
import { ServiciosAppController } from "./servicios-app.controller";
import { ServiciosAppService } from "./servicios-app.service";

@Module({
  controllers: [ServiciosAppController],
  providers: [ServiciosAppService],
})
export class ServiciosAppModule {}
