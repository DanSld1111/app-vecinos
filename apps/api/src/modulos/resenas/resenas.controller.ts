import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Cuenta, Resena, ResumenResenas, UsuarioApp } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { JwtVecinoAuthGuard } from "../usuarios/jwt-vecino-auth.guard";
import { ResenasService } from "./resenas.service";
import { CrearResenaDto } from "./dto/crear-resena.dto";

type SolicitudConVecino = { user: UsuarioApp };
type SolicitudConCuenta = { user: Cuenta };

@Controller("resenas")
export class ResenasController {
  constructor(private readonly resenas: ResenasService) {}

  @Get()
  listarPorNegocio(@Query("negocioId") negocioId: string): Promise<Resena[]> {
    return this.resenas.listarPorNegocio(negocioId);
  }

  @Get("resumen")
  resumen(@Query("negocioId") negocioId: string): Promise<ResumenResenas> {
    return this.resenas.resumen(negocioId);
  }

  @Get("mia")
  @UseGuards(JwtVecinoAuthGuard)
  obtenerPropia(@Query("negocioId") negocioId: string, @Req() req: SolicitudConVecino): Promise<Resena | null> {
    return this.resenas.obtenerPropia(negocioId, req.user.id);
  }

  @Post()
  @UseGuards(JwtVecinoAuthGuard)
  crearOActualizar(@Body() dto: CrearResenaDto, @Req() req: SolicitudConVecino): Promise<Resena> {
    return this.resenas.crearOActualizar(dto, req.user.id);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(JwtVecinoAuthGuard)
  async eliminarPropia(@Param("id") id: string, @Req() req: SolicitudConVecino): Promise<void> {
    await this.resenas.eliminarPropia(id, req.user.id);
  }

  @Patch(":id/ocultar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  ocultar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<Resena> {
    return this.resenas.ocultar(id, req.user.id);
  }

  @Patch(":id/mostrar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  mostrar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<Resena> {
    return this.resenas.mostrar(id, req.user.id);
  }
}
