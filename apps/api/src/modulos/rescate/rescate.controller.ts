import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { memoryStorage } from "multer";
import type { Cuenta, UsuarioApp } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { JwtVecinoAuthGuard } from "../usuarios/jwt-vecino-auth.guard";
import { RescateService } from "./rescate.service";
import {
  ApadrinarDto,
  CrearAvisoDto,
  DatosAlbergueDto,
  EstadoPadrinazgoDto,
  EstadoSolicitudDto,
  GuardarMascotaDto,
  ModerarAvisoDto,
  OrdenMascotasDto,
  PistaDto,
  ReportarAvisoDto,
  SolicitarAdopcionDto,
} from "./dto/rescate.dto";

type SolicitudConCuenta = { user: Cuenta };
type SolicitudConVecino = { user: UsuarioApp };

const FOTOS_PERMITIDAS = new Set(["image/jpeg", "image/png", "image/webp"]);
const opcionesFoto = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: unknown, archivo: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) =>
    FOTOS_PERMITIDAS.has(archivo.mimetype) ? cb(null, true) : cb(new BadRequestException("Solo se aceptan fotos JPG, PNG o WEBP."), false),
};

/** Lo que ve el vecino (decisión 0097). Leer no pide cuenta; adoptar, apadrinar y publicar avisos sí. */
@Controller("rescate")
export class RescateController {
  constructor(private readonly rescate: RescateService) {}

  @Get("inicio")
  inicio(@Query("comunidadId") comunidadId: string) {
    if (!comunidadId) throw new BadRequestException("Falta la comunidad.");
    return this.rescate.inicio(comunidadId);
  }

  @Get("mascotas/:id")
  mascota(@Param("id") id: string) {
    return this.rescate.mascota(id);
  }

  @Get("albergues/:negocioId/mascotas")
  mascotasDeAlbergue(@Param("negocioId") negocioId: string) {
    return this.rescate.mascotasDeAlbergue(negocioId);
  }

  @Get("avisos")
  avisos(@Query("comunidadId") comunidadId: string) {
    if (!comunidadId) throw new BadRequestException("Falta la comunidad.");
    return this.rescate.listarAvisos(comunidadId, null);
  }

  @Get("avisos/:id")
  aviso(@Param("id") id: string) {
    return this.rescate.aviso(id, null);
  }

  /** El mismo aviso, sabiendo si quien lo mira es quien lo publicó (y aunque esté cerrado). */
  @Get("avisos/:id/mio")
  @UseGuards(JwtVecinoAuthGuard)
  avisoComoVecino(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.rescate.aviso(id, req.user.id);
  }

  @Get("actividad")
  @UseGuards(JwtVecinoAuthGuard)
  actividad(@Req() req: SolicitudConVecino) {
    return this.rescate.actividad(req.user);
  }

  @Post("mascotas/:id/solicitudes")
  @UseGuards(JwtVecinoAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  solicitar(@Param("id") id: string, @Body() dto: SolicitarAdopcionDto, @Req() req: SolicitudConVecino) {
    return this.rescate.solicitarAdopcion(id, req.user, dto);
  }

  @Post("solicitudes/:id/cancelar")
  @UseGuards(JwtVecinoAuthGuard)
  cancelarSolicitud(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.rescate.cancelarSolicitud(id, req.user);
  }

  @Post("mascotas/:id/padrinazgos")
  @UseGuards(JwtVecinoAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  apadrinar(@Param("id") id: string, @Body() dto: ApadrinarDto, @Req() req: SolicitudConVecino) {
    return this.rescate.apadrinar(id, req.user, dto);
  }

  @Post("padrinazgos/:id/cancelar")
  @UseGuards(JwtVecinoAuthGuard)
  cancelarPadrinazgo(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.rescate.cancelarPadrinazgo(id, req.user);
  }

  @Post("avisos/fotos")
  @UseGuards(JwtVecinoAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @UseInterceptors(FileInterceptor("foto", opcionesFoto))
  subirFotoAviso(@UploadedFile() archivo: Express.Multer.File) {
    if (!archivo) throw new BadRequestException("Falta la foto.");
    return this.rescate.subirFotoAviso(archivo);
  }

  @Post("avisos")
  @UseGuards(JwtVecinoAuthGuard)
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  crearAviso(@Body() dto: CrearAvisoDto, @Req() req: SolicitudConVecino) {
    return this.rescate.crearAviso(req.user, dto);
  }

  @Post("avisos/:id/cerrar")
  @UseGuards(JwtVecinoAuthGuard)
  cerrarAviso(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.rescate.cerrarAviso(id, req.user);
  }

  @Post("avisos/:id/reabrir")
  @UseGuards(JwtVecinoAuthGuard)
  reabrirAviso(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.rescate.cerrarAviso(id, req.user, true);
  }

  @Post("avisos/:id/pistas")
  @UseGuards(JwtVecinoAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  pista(@Param("id") id: string, @Body() dto: PistaDto, @Req() req: SolicitudConVecino) {
    return this.rescate.agregarPista(id, req.user, dto);
  }

  @Post("avisos/:id/reportar")
  @UseGuards(JwtVecinoAuthGuard)
  @HttpCode(204)
  async reportar(@Param("id") id: string, @Body() dto: ReportarAvisoDto, @Req() req: SolicitudConVecino): Promise<void> {
    await this.rescate.reportarAviso(id, req.user, dto.motivo);
  }
}

/** Panel del albergue: el dueño, el gestor de negocios y el super admin. */
@Controller("rescate/admin/albergues/:negocioId")
@UseGuards(JwtAuthGuard)
export class RescateAlbergueController {
  constructor(private readonly rescate: RescateService) {}

  @Get("mascotas")
  mascotas(@Param("negocioId") negocioId: string, @Req() req: SolicitudConCuenta) {
    return this.rescate.mascotasAdmin(negocioId, req.user);
  }

  @Post("mascotas")
  crear(@Param("negocioId") negocioId: string, @Body() dto: GuardarMascotaDto, @Req() req: SolicitudConCuenta) {
    return this.rescate.crearMascota(negocioId, dto, req.user);
  }

  @Put("mascotas/orden")
  ordenar(@Param("negocioId") negocioId: string, @Body() dto: OrdenMascotasDto, @Req() req: SolicitudConCuenta) {
    return this.rescate.ordenarMascotas(negocioId, dto.ids, req.user);
  }

  @Patch("mascotas/:id")
  actualizar(@Param("negocioId") negocioId: string, @Param("id") id: string, @Body() dto: GuardarMascotaDto, @Req() req: SolicitudConCuenta) {
    return this.rescate.actualizarMascota(negocioId, id, dto, req.user);
  }

  @Delete("mascotas/:id")
  @HttpCode(204)
  async eliminar(@Param("negocioId") negocioId: string, @Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<void> {
    await this.rescate.eliminarMascota(negocioId, id, req.user);
  }

  @Post("fotos")
  @UseInterceptors(FileInterceptor("foto", opcionesFoto))
  subirFoto(@Param("negocioId") negocioId: string, @UploadedFile() archivo: Express.Multer.File, @Req() req: SolicitudConCuenta) {
    if (!archivo) throw new BadRequestException("Falta la foto.");
    return this.rescate.subirFotoMascota(negocioId, archivo, req.user);
  }

  @Get("datos")
  datos(@Param("negocioId") negocioId: string, @Req() req: SolicitudConCuenta) {
    return this.rescate.datosAlbergue(negocioId, req.user);
  }

  @Put("datos")
  guardarDatos(@Param("negocioId") negocioId: string, @Body() dto: DatosAlbergueDto, @Req() req: SolicitudConCuenta) {
    return this.rescate.guardarDatosAlbergue(negocioId, dto, req.user);
  }

  @Get("solicitudes")
  solicitudes(@Param("negocioId") negocioId: string, @Req() req: SolicitudConCuenta) {
    return this.rescate.solicitudesAdmin(negocioId, req.user);
  }

  @Patch("solicitudes/:id")
  estadoSolicitud(@Param("negocioId") negocioId: string, @Param("id") id: string, @Body() dto: EstadoSolicitudDto, @Req() req: SolicitudConCuenta) {
    return this.rescate.cambiarEstadoSolicitud(negocioId, id, dto.estado as never, req.user);
  }

  @Get("padrinazgos")
  padrinazgos(@Param("negocioId") negocioId: string, @Req() req: SolicitudConCuenta) {
    return this.rescate.padrinazgosAdmin(negocioId, req.user);
  }

  @Patch("padrinazgos/:id")
  accionPadrinazgo(@Param("negocioId") negocioId: string, @Param("id") id: string, @Body() dto: EstadoPadrinazgoDto, @Req() req: SolicitudConCuenta) {
    return this.rescate.accionPadrinazgo(negocioId, id, dto.accion as "confirmar" | "cancelar", req.user);
  }
}

const FILTROS = ["todos", "reportados", "ocultos", "cerrados"] as const;

/** Panel de ELISUR: moderar los avisos de perdidos y encontrados. */
@Controller("rescate/admin/avisos")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
export class RescateAvisosAdminController {
  constructor(private readonly rescate: RescateService) {}

  @Get()
  listar(@Query("filtro") filtro?: string) {
    const f = FILTROS.includes(filtro as never) ? (filtro as (typeof FILTROS)[number]) : "todos";
    return this.rescate.avisosAdmin(f);
  }

  @Get("resumen")
  resumen() {
    return this.rescate.resumenAvisos();
  }

  @Patch(":id")
  moderar(@Param("id") id: string, @Body() dto: ModerarAvisoDto, @Req() req: SolicitudConCuenta) {
    return this.rescate.moderarAviso(id, dto.estado as "publicado" | "oculto", req.user);
  }
}
