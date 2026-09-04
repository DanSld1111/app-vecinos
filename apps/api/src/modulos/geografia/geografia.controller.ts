import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Comunidad } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { GeografiaService } from "./geografia.service";
import { DetectarComunidadDto } from "./dto/detectar-comunidad.dto";
import { CrearComunidadDto } from "./dto/crear-comunidad.dto";

@Controller("comunidades")
export class GeografiaController {
  constructor(private readonly geografia: GeografiaService) {}

  @Get()
  listar(): Promise<Comunidad[]> {
    return this.geografia.listarComunidadesActivas();
  }

  // Antes de ":id" a propósito: si no, Nest la capturaría como un id literal "detectar" / "todas".
  @Get("detectar")
  detectar(@Query() query: DetectarComunidadDto): Promise<Comunidad | null> {
    return this.geografia.detectarPorCoordenada(query.lat, query.lng);
  }

  /** Panel admin: todas las comunidades, no solo las activas (a diferencia del GET público de arriba). */
  @Get("todas")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  listarTodas(): Promise<Comunidad[]> {
    return this.geografia.listarTodasComunidades();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  crear(@Body() dto: CrearComunidadDto): Promise<Comunidad> {
    return this.geografia.crearComunidad(dto);
  }

  @Patch(":id/activar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  activar(@Param("id") id: string): Promise<Comunidad> {
    return this.geografia.activarComunidad(id);
  }

  @Patch(":id/desactivar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  desactivar(@Param("id") id: string): Promise<Comunidad> {
    return this.geografia.desactivarComunidad(id);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  async eliminar(@Param("id") id: string): Promise<void> {
    await this.geografia.eliminarComunidad(id);
  }

  @Get(":id")
  async obtener(@Param("id") id: string): Promise<Comunidad> {
    const comunidad = await this.geografia.obtenerPorId(id);
    if (!comunidad) throw new NotFoundException(`No existe una comunidad con id "${id}"`);
    return comunidad;
  }
}
