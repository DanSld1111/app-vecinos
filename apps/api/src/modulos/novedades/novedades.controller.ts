import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Cuenta, Novedad } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { NovedadesService } from "./novedades.service";
import { CrearNovedadDto } from "./dto/crear-novedad.dto";
import { ActualizarNovedadDto } from "./dto/actualizar-novedad.dto";

type SolicitudConCuenta = { user: Cuenta };

/** Changelog del propio producto, visible en Notificaciones → Novedades. Ver docs/decisiones/0034-conexion-real-paneles.md. */
@Controller("novedades")
export class NovedadesController {
  constructor(private readonly novedades: NovedadesService) {}

  @Get()
  listar(): Promise<Novedad[]> {
    return this.novedades.listar();
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  listarAdmin(): Promise<Novedad[]> {
    return this.novedades.listarAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  crear(@Body() dto: CrearNovedadDto, @Req() req: SolicitudConCuenta): Promise<Novedad> {
    return this.novedades.crear(dto, req.user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  actualizar(
    @Param("id") id: string,
    @Body() dto: ActualizarNovedadDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Novedad> {
    return this.novedades.actualizar(id, dto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  async eliminar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<{ ok: true }> {
    await this.novedades.eliminar(id, req.user.id);
    return { ok: true };
  }
}
