import { Controller, Get, HttpCode, Post, Body, UseGuards, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Cuenta } from "@app-vecinos/tipos";
import { AuthService, SesionIniciada } from "./auth.service";
import { IniciarSesionDto } from "./dto/iniciar-sesion.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { OlvidarClaveDto } from "../../comun/dto/olvidar-clave.dto";
import { RestablecerClaveConCodigoDto } from "../../comun/dto/restablecer-clave-con-codigo.dto";

// Límite estricto para las rutas de autenticación: 5 intentos por minuto por IP. El límite
// general (100/min) de ThrottlerModule sigue aplicando a todo lo demás — ver app.module.ts.
const LIMITE_AUTH = { default: { limit: 5, ttl: 60_000 } };

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("iniciar-sesion")
  @Throttle(LIMITE_AUTH)
  iniciarSesion(@Body() dto: IniciarSesionDto): Promise<SesionIniciada> {
    return this.auth.iniciarSesion(dto.correo, dto.contrasena);
  }

  @Get("perfil")
  @UseGuards(JwtAuthGuard)
  perfil(@Req() req: { user: Cuenta }): Cuenta {
    return req.user;
  }

  @Post("olvide-clave")
  @HttpCode(200)
  @Throttle(LIMITE_AUTH)
  async olvideClave(@Body() dto: OlvidarClaveDto): Promise<{ mensaje: string }> {
    await this.auth.solicitarRecuperacion(dto.correo);
    return { mensaje: "Si el correo existe, te enviamos un código de recuperación." };
  }

  @Post("restablecer-clave")
  @HttpCode(200)
  @Throttle(LIMITE_AUTH)
  async restablecerClave(@Body() dto: RestablecerClaveConCodigoDto): Promise<{ mensaje: string }> {
    await this.auth.restablecerConCodigo(dto.correo, dto.codigo, dto.nuevaContrasena);
    return { mensaje: "Contraseña actualizada. Ya puedes iniciar sesión." };
  }
}
