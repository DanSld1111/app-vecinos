import { Module } from "@nestjs/common";
import { BusquedaModule } from "../busqueda/busqueda.module";
import { NegociosController } from "./negocios.controller";
import { NegociosService } from "./negocios.service";

@Module({
  imports: [BusquedaModule],
  controllers: [NegociosController],
  providers: [NegociosService],
})
export class NegociosModule {}
