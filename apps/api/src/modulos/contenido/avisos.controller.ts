import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Aviso, Cuenta, ResultadoPaginado } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AvisosService } from "./avisos.service";
import { ListarAvisosPublicosDto } from "./dto/listar-avisos-publicos.dto";
import { CrearAvisoDirectoDto } from "./dto/crear-aviso-directo.dto";
import { EnviarAValidacionDto } from "./dto/enviar-a-validacion.dto";
import { ReenviarAvisoDto } from "./dto/reenviar-aviso.dto";
import { RechazarAvisoDto } from "./dto/rechazar-aviso.dto";

type SolicitudConCuenta = { user: Cuenta };

@Controller("avisos")
export class AvisosController {
  constructor(private readonly avisos: AvisosService) {}

  @Get()
  listarPublicados(@Query() filtro: ListarAvisosPublicosDto): Promise<ResultadoPaginado<Aviso>> {
    return this.avisos.listarPublicados(filtro);
  }

  @Get("todos")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  listarTodos(): Promise<Aviso[]> {
    return this.avisos.listarTodos();
  }

  @Get("mios")
  @UseGuards(JwtAuthGuard)
  listarPropios(@Req() req: SolicitudConCuenta): Promise<Aviso[]> {
    return this.avisos.listarPropios(req.user.id);
  }

  @Get("pendientes")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  listarPendientes(@Req() req: SolicitudConCuenta): Promise<Aviso[]> {
    return this.avisos.listarPendientes(req.user);
  }

  @Get("historial")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  listarHistorial(@Req() req: SolicitudConCuenta): Promise<Aviso[]> {
    return this.avisos.listarHistorial(req.user);
  }

  @Post("directo")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  crearDirecto(@Body() dto: CrearAvisoDirectoDto, @Req() req: SolicitudConCuenta): Promise<Aviso> {
    return this.avisos.crearDirecto(dto, req.user.id);
  }

  @Post("enviar-a-validacion")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("junta_vecinal", "super_admin")
  enviarAValidacion(@Body() dto: EnviarAValidacionDto, @Req() req: SolicitudConCuenta): Promise<Aviso> {
    return this.avisos.enviarAValidacion(dto, req.user.id);
  }

  @Patch(":id/reenviar")
  @UseGuards(JwtAuthGuard)
  reenviar(
    @Param("id") id: string,
    @Body() dto: ReenviarAvisoDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Aviso> {
    return this.avisos.reenviarTrasRechazo(id, dto, req.user.id);
  }

  @Patch(":id/aprobar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  aprobar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<Aviso> {
    return this.avisos.aprobar(id, req.user);
  }

  @Patch(":id/rechazar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  rechazar(
    @Param("id") id: string,
    @Body() dto: RechazarAvisoDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Aviso> {
    return this.avisos.rechazar(id, dto.motivo, req.user);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  async eliminar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<void> {
    await this.avisos.eliminar(id, req.user.id);
  }
}
