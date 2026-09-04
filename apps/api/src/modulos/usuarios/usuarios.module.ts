import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsuariosController } from "./usuarios.controller";
import { UsuariosService } from "./usuarios.service";
import { VecinosAuthController } from "./vecinos-auth.controller";
import { VecinosAuthService } from "./vecinos-auth.service";
import { JwtVecinoStrategy } from "./jwt-vecino.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_VECINO ?? "cambiar-en-produccion-vecino",
      // Ver el comentario equivalente en auth.module.ts.
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN_VECINO ?? "30d") as `${number}${"s" | "m" | "h" | "d"}` },
    }),
  ],
  controllers: [UsuariosController, VecinosAuthController],
  providers: [UsuariosService, VecinosAuthService, JwtVecinoStrategy],
})
export class UsuariosModule {}
