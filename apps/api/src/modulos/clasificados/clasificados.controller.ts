import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { memoryStorage } from "multer";
import type { Cuenta, UsuarioApp } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { JwtVecinoAuthGuard } from "../usuarios/jwt-vecino-auth.guard";
import { BandejaClasificados, ClasificadosService } from "./clasificados.service";
import {
  CerrarClasificadoDto,
  EnviarClasificadoDto,
  GuardarClasificadoDto,
  RechazarClasificadoDto,
  ReportarClasificadoDto,
  SECCIONES,
  SUBTIPOS,
} from "./dto/clasificados.dto";

type SolicitudConCuenta = { user: Cuenta };
type SolicitudConVecino = { user: UsuarioApp };

const FOTOS_PERMITIDAS = new Set(["image/jpeg", "image/png", "image/webp"]);
const opcionesFoto = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: unknown, archivo: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) =>
    FOTOS_PERMITIDAS.has(archivo.mimetype) ? cb(null, true) : cb(new BadRequestException("Solo se aceptan fotos JPG, PNG o WEBP."), false),
};

const BANDEJAS: BandejaClasificados[] = ["revisar", "publicados", "por_vencer", "cerrados"];

/** Panel de ELISUR: revisar, ordenar y publicar los avisos (decisión 0098). Va antes que el público
 * para que «admin» no se lea como un id. */
@Controller("clasificados/admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "validador_contenido")
export class ClasificadosAdminController {
  constructor(private readonly clasificados: ClasificadosService) {}

  @Get()
  bandeja(@Query("bandeja") bandeja?: string, @Query("seccion") seccion?: string) {
    const b = BANDEJAS.includes(bandeja as BandejaClasificados) ? (bandeja as BandejaClasificados) : "revisar";
    return this.clasificados.bandeja(b, SECCIONES.includes(seccion ?? "") ? seccion : undefined);
  }

  @Get("resumen")
  resumen() {
    return this.clasificados.resumen();
  }

  @Post("fotos")
  @UseInterceptors(FileInterceptor("foto", opcionesFoto))
  subirFoto(@UploadedFile() archivo: Express.Multer.File) {
    if (!archivo) throw new BadRequestException("Falta la foto.");
    return this.clasificados.subirFotoAdmin(archivo);
  }

  @Post()
  crear(@Body() dto: GuardarClasificadoDto, @Req() req: SolicitudConCuenta) {
    return this.clasificados.crearAdmin(dto, req.user);
  }

  @Get(":id")
  detalle(@Param("id") id: string) {
    return this.clasificados.detalleAdmin(id);
  }

  @Put(":id")
  guardar(@Param("id") id: string, @Body() dto: GuardarClasificadoDto, @Req() req: SolicitudConCuenta) {
    return this.clasificados.guardar(id, dto, req.user);
  }

  @Post(":id/publicar")
  publicar(@Param("id") id: string, @Req() req: SolicitudConCuenta) {
    return this.clasificados.publicar(id, req.user);
  }

  @Post(":id/rechazar")
  rechazar(@Param("id") id: string, @Body() dto: RechazarClasificadoDto, @Req() req: SolicitudConCuenta) {
    return this.clasificados.rechazar(id, dto.motivo, req.user);
  }

  @Post(":id/cerrar")
  cerrar(@Param("id") id: string, @Body() dto: CerrarClasificadoDto, @Req() req: SolicitudConCuenta) {
    return this.clasificados.cerrarAdmin(id, dto.cierre, req.user);
  }
}

/** Lo que ve y hace el vecino. Leer no pide cuenta; enviar, renovar y cerrar sí. */
@Controller("clasificados")
export class ClasificadosController {
  constructor(private readonly clasificados: ClasificadosService) {}

  @Get()
  listar(
    @Query("comunidadId") comunidadId: string,
    @Query("seccion") seccion?: string,
    @Query("subtipo") subtipo?: string,
    @Query("tipo") tipo?: string,
    @Query("q") q?: string,
    @Query("limite") limite?: string,
  ) {
    if (!comunidadId) throw new BadRequestException("Falta la comunidad.");
    return this.clasificados.listar({
      comunidadId,
      seccion: SECCIONES.includes(seccion ?? "") ? seccion : undefined,
      subtipo: SUBTIPOS.includes(subtipo ?? "") ? subtipo : undefined,
      tipo: tipo?.slice(0, 30) || undefined,
      q: q?.slice(0, 80),
      limite: limite ? Number(limite) || undefined : undefined,
    });
  }

  @Get("mios")
  @UseGuards(JwtVecinoAuthGuard)
  mios(@Req() req: SolicitudConVecino) {
    return this.clasificados.mios(req.user);
  }

  @Post("fotos")
  @UseGuards(JwtVecinoAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @UseInterceptors(FileInterceptor("foto", opcionesFoto))
  subirFoto(@UploadedFile() archivo: Express.Multer.File) {
    if (!archivo) throw new BadRequestException("Falta la foto.");
    return this.clasificados.subirFoto(archivo);
  }

  @Post()
  @UseGuards(JwtVecinoAuthGuard)
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  enviar(@Body() dto: EnviarClasificadoDto, @Req() req: SolicitudConVecino) {
    return this.clasificados.enviar(req.user, dto);
  }

  @Get(":id")
  ver(@Param("id") id: string) {
    return this.clasificados.ver(id);
  }

  @Post(":id/contacto")
  @HttpCode(204)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async contacto(@Param("id") id: string): Promise<void> {
    await this.clasificados.contacto(id);
  }

  @Post(":id/renovar")
  @UseGuards(JwtVecinoAuthGuard)
  renovar(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.clasificados.renovar(id, req.user);
  }

  @Post(":id/cerrar")
  @UseGuards(JwtVecinoAuthGuard)
  cerrar(@Param("id") id: string, @Body() dto: CerrarClasificadoDto, @Req() req: SolicitudConVecino) {
    return this.clasificados.cerrarPropio(id, req.user, dto.cierre);
  }

  @Post(":id/reportar")
  @UseGuards(JwtVecinoAuthGuard)
  @HttpCode(204)
  async reportar(@Param("id") id: string, @Body() dto: ReportarClasificadoDto, @Req() req: SolicitudConVecino): Promise<void> {
    await this.clasificados.reportar(id, req.user, dto.motivo);
  }
}
