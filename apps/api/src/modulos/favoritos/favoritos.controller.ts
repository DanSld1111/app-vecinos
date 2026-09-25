import { Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Negocio, UsuarioApp } from "@app-vecinos/tipos";
import { JwtVecinoAuthGuard } from "../usuarios/jwt-vecino-auth.guard";
import { FavoritosService } from "./favoritos.service";

type SolicitudConVecino = { user: UsuarioApp };

/** Siempre de un vecino registrado — "modo prueba" (sin cuenta) no tiene favoritos. */
@Controller("favoritos")
@UseGuards(JwtVecinoAuthGuard)
export class FavoritosController {
  constructor(private readonly favoritos: FavoritosService) {}

  @Get()
  listar(@Req() req: SolicitudConVecino): Promise<Negocio[]> {
    return this.favoritos.listar(req.user.id);
  }

  @Get("ids")
  listarIds(@Req() req: SolicitudConVecino): Promise<string[]> {
    return this.favoritos.listarIds(req.user.id);
  }

  @Post(":negocioId")
  @HttpCode(204)
  async agregar(@Param("negocioId") negocioId: string, @Req() req: SolicitudConVecino): Promise<void> {
    await this.favoritos.agregar(req.user.id, negocioId);
  }

  @Delete(":negocioId")
  @HttpCode(204)
  async quitar(@Param("negocioId") negocioId: string, @Req() req: SolicitudConVecino): Promise<void> {
    await this.favoritos.quitar(req.user.id, negocioId);
  }
}
