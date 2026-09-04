import { Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Distrito } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { GeografiaService } from "./geografia.service";
import { BuscarDistritosDto } from "./dto/buscar-distritos.dto";

/**
 * Todo lo de acá es exclusivo del panel admin — la app móvil solo consume `comunidades`
 * (ver geografia.controller.ts), nunca distritos en crudo. Ver docs/decisiones/0034.
 */
@Controller("distritos")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
export class DistritosController {
  constructor(private readonly geografia: GeografiaService) {}

  /** Los que ya están operativos — lo que hoy se ve como tarjetas en /distritos. */
  @Get()
  listarActivos(): Promise<Distrito[]> {
    return this.geografia.listarDistritosActivos();
  }

  /** Antes de ":ubigeo/activar" a propósito, aunque hoy no colisionan — mismo criterio que arriba. */
  @Get("buscar")
  buscar(@Query() filtro: BuscarDistritosDto): Promise<Distrito[]> {
    return this.geografia.buscarDistritos(filtro.q);
  }

  @Patch(":ubigeo/activar")
  activar(@Param("ubigeo") ubigeo: string): Promise<Distrito> {
    return this.geografia.activarDistrito(ubigeo);
  }

  @Patch(":ubigeo/desactivar")
  desactivar(@Param("ubigeo") ubigeo: string): Promise<Distrito> {
    return this.geografia.desactivarDistrito(ubigeo);
  }
}
