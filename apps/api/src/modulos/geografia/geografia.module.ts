import { Module } from "@nestjs/common";
import { GeografiaController } from "./geografia.controller";
import { DistritosController } from "./distritos.controller";
import { GeografiaService } from "./geografia.service";

@Module({
  controllers: [GeografiaController, DistritosController],
  providers: [GeografiaService],
})
export class GeografiaModule {}
