import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "cambiar-en-produccion",
      // @nestjs/jwt (a partir de v11) tipa expiresIn contra el formato de duración de la
      // librería "ms" ("12h", "30d"...) en vez de "string" a secas — una variable de entorno
      // siempre es "string" para TypeScript, así que hace falta este cast explícito. El valor
      // real ya se valida a mano en validar-entorno.ts si hiciera falta más adelante.
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? "12h") as `${number}${"s" | "m" | "h" | "d"}` },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService],
})
export class AuthModule {}
