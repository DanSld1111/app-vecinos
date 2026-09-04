import { Module } from "@nestjs/common";
import { ArquetiposController } from "./arquetipos.controller";
import { ArquetiposService } from "./arquetipos.service";

@Module({
  controllers: [ArquetiposController],
  providers: [ArquetiposService],
})
export class ArquetiposModule {}
