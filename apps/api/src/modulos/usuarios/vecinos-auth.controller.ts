import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { UsuarioApp } from "@app-vecinos/tipos";
import { VecinosAuthService, SesionVecino } from "./vecinos-auth.service";
import { RegistrarVecinoDto } from "./dto/registrar-vecino.dto";
import { IniciarSesionVecinoDto } from "./dto/iniciar-sesion-vecino.dto";
import { GuardarPushTokenDto } from "./dto/guardar-push-token.dto";
import { JwtVecinoAuthGuard } from "./jwt-vecino-auth.guard";
import { OlvidarClaveDto } from "../../comun/dto/olvidar-clave.dto";
import { RestablecerClaveConCodigoDto } from "../../comun/dto/restablecer-clave-con-codigo.dto";
import { NotificacionesPushService } from "../../comun/notificaciones-push/notificaciones-push.service";

// Mismo límite estricto que en auth.controller.ts (5/min por IP) — ver docs/tecnica/11-plan-seguridad.md.
const LIMITE_AUTH = { default: { limit: 5, ttl: 60_000 } };

@Controller("auth/vecino")
export class VecinosAuthController {
  constructor(
    private readonly vecinosAuth: VecinosAuthService,
    private readonly notificacionesPush: NotificacionesPushService,
  ) {}

  @Post("registro")
  @Throttle(LIMITE_AUTH)
  registrar(@Body() dto: RegistrarVecinoDto): Promise<SesionVecino> {
    return this.vecinosAuth.registrar(dto);
  }

  @Post("iniciar-sesion")
  @Throttle(LIMITE_AUTH)
  iniciarSesion(@Body() dto: IniciarSesionVecinoDto): Promise<SesionVecino> {
    return this.vecinosAuth.iniciarSesion(dto.correo, dto.contrasena);
  }

  @Get("perfil")
  @UseGuards(JwtVecinoAuthGuard)
  perfil(@Req() req: { user: UsuarioApp }): UsuarioApp {
    return req.user;
  }

  @Post("push-token")
  @HttpCode(204)
  @UseGuards(JwtVecinoAuthGuard)
  async guardarPushToken(@Body() dto: GuardarPushTokenDto, @Req() req: { user: UsuarioApp }): Promise<void> {
    await this.notificacionesPush.guardarToken(req.user.id, dto.pushToken ?? null);
  }

  @Post("olvide-clave")
  @HttpCode(200)
  @Throttle(LIMITE_AUTH)
  async olvideClave(@Body() dto: OlvidarClaveDto): Promise<{ mensaje: string }> {
    await this.vecinosAuth.solicitarRecuperacion(dto.correo);
    return { mensaje: "Si el correo existe, te enviamos un código de recuperación." };
  }

  @Post("restablecer-clave")
  @HttpCode(200)
  @Throttle(LIMITE_AUTH)
  async restablecerClave(@Body() dto: RestablecerClaveConCodigoDto): Promise<{ mensaje: string }> {
    await this.vecinosAuth.restablecerConCodigo(dto.correo, dto.codigo, dto.nuevaContrasena);
    return { mensaje: "Contraseña actualizada. Ya puedes iniciar sesión." };
  }
}
