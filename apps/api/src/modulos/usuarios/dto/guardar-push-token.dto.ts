import { IsOptional, IsString } from "class-validator";

export class GuardarPushTokenDto {
  // Opcional: null/ausente = el vecino desactivó las notificaciones, se borra el token guardado.
  @IsOptional()
  @IsString()
  pushToken?: string | null;
}
