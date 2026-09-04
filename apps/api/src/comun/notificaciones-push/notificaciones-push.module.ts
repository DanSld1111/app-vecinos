import { Global, Module } from "@nestjs/common";
import { NotificacionesPushService } from "./notificaciones-push.service";

@Global()
@Module({
  providers: [NotificacionesPushService],
  exports: [NotificacionesPushService],
})
export class NotificacionesPushModule {}
