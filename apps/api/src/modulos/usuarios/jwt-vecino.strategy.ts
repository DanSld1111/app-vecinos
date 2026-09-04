import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsuarioApp } from "@app-vecinos/tipos";
import { VecinosAuthService } from "./vecinos-auth.service";

interface PayloadToken {
  sub: string;
}

/**
 * Estrategia separada de la de `cuentas` (JwtStrategy) — un token de vecino y uno de cuenta
 * de panel nunca deben ser intercambiables, aunque compartan la forma { sub }. Nombrarla
 * "jwt-vecino" evita que ambas registren la misma estrategia global de passport bajo "jwt".
 */
@Injectable()
export class JwtVecinoStrategy extends PassportStrategy(Strategy, "jwt-vecino") {
  constructor(private readonly vecinosAuth: VecinosAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_VECINO ?? "cambiar-en-produccion-vecino",
    });
  }

  async validate(payload: PayloadToken): Promise<UsuarioApp> {
    const usuario = await this.vecinosAuth.obtenerVigente(payload.sub);
    if (!usuario) throw new UnauthorizedException("La cuenta ya no está activa.");
    return usuario;
  }
}
