import { Module } from "@nestjs/common";
import { RescateAlbergueController, RescateAvisosAdminController, RescateController } from "./rescate.controller";
import { RescateService } from "./rescate.service";

/** Rescate animal: adopción, padrinazgo y perdidos y encontrados. Ver docs/decisiones/0097. */
@Module({
  controllers: [RescateController, RescateAlbergueController, RescateAvisosAdminController],
  providers: [RescateService],
})
export class RescateModule {}
