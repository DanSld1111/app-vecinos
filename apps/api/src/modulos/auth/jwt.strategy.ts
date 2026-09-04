import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Cuenta } from "@app-vecinos/tipos";
import { AuthService } from "./auth.service";

interface PayloadToken {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly auth: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "cambiar-en-produccion",
    });
  }

  async validate(payload: PayloadToken): Promise<Cuenta> {
    const cuenta = await this.auth.obtenerCuentaVigente(payload.sub);
    if (!cuenta) throw new UnauthorizedException("La cuenta ya no está activa.");
    return cuenta;
  }
}
