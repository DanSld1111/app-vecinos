import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { ComentarioPublicacion, Cuenta, FiltroComentarios, MetricaParaTi, ModulosApp, Publicacion, ResumenComentarios, UsuarioApp } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { JwtVecinoAuthGuard } from "../usuarios/jwt-vecino-auth.guard";
import { ParaTiService } from "./para-ti.service";
import {
  ActualizarModuloDto,
  ComentarDto,
  ComentarElisurDto,
  EnlaceYoutubeDto,
  FijarComentarioDto,
  FirmarVideoDto,
  GuardarPublicacionDto,
  ModerarComentarioDto,
  OrdenDestacadasDto,
  PermitirComentariosDto,
  ReportarComentarioDto,
  SilenciarDto,
  VisitaDto,
} from "./dto/guardar-publicacion.dto";

type SolicitudConCuenta = { user: Cuenta };
type SolicitudConVecino = { user: UsuarioApp };

const FOTOS_PERMITIDAS = new Set(["image/jpeg", "image/png", "image/webp"]);
const opcionesFoto = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: unknown, archivo: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) =>
    FOTOS_PERMITIDAS.has(archivo.mimetype) ? cb(null, true) : cb(new BadRequestException("Solo se aceptan fotos JPG, PNG o WEBP."), false),
};

/** Pestañas que se encienden y apagan (decisión 0091). Leerlas es público: la app las necesita al abrir. */
@Controller("modulos")
export class ModulosController {
  constructor(private readonly paraTi: ParaTiService) {}

  @Get()
  listar(): Promise<ModulosApp> {
    return this.paraTi.modulos();
  }

  @Patch(":clave")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  actualizar(@Param("clave") clave: string, @Body() dto: ActualizarModuloDto, @Req() req: SolicitudConCuenta): Promise<ModulosApp> {
    return this.paraTi.actualizarModulo(clave, dto.activo, req.user.id);
  }
}

/** Lo que ve el vecino. Leer no pide cuenta; dar corazón, comentar y reportar sí. */
@Controller("para-ti")
export class ParaTiController {
  constructor(private readonly paraTi: ParaTiService) {}

  @Get("publicaciones")
  listar(@Query("antesDe") antesDe?: string, @Query("limite") limite?: string, @Query("q") q?: string, @Query("videos") videos?: string) {
    return this.paraTi.listarPublicadas(antesDe || undefined, limite ? Number(limite) : undefined, { q, soloVideos: videos === "1" });
  }

  @Get("destacadas")
  destacadas(): Promise<Publicacion[]> {
    return this.paraTi.destacadas();
  }

  @Post("visita")
  @HttpCode(204)
  async visita(@Body() dto: VisitaDto): Promise<void> {
    await this.paraTi.registrarVisita(dto.visitante);
  }

  @Get("corazones")
  @UseGuards(JwtVecinoAuthGuard)
  misCorazones(@Req() req: SolicitudConVecino): Promise<string[]> {
    return this.paraTi.misCorazones(req.user.id);
  }

  @Get("publicaciones/:id")
  obtener(@Param("id") id: string): Promise<Publicacion> {
    return this.paraTi.obtenerPublicada(id);
  }

  @Post("publicaciones/:id/compartir")
  @HttpCode(204)
  async compartir(@Param("id") id: string): Promise<void> {
    await this.paraTi.compartir(id);
  }

  @Post("publicaciones/:id/corazon")
  @UseGuards(JwtVecinoAuthGuard)
  darCorazon(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.paraTi.darCorazon(id, req.user.id);
  }

  @Delete("publicaciones/:id/corazon")
  @UseGuards(JwtVecinoAuthGuard)
  quitarCorazon(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.paraTi.quitarCorazon(id, req.user.id);
  }

  @Get("publicaciones/:id/comentarios")
  comentarios(@Param("id") id: string): Promise<ComentarioPublicacion[]> {
    return this.paraTi.comentarios(id);
  }

  @Get("publicaciones/:id/comentarios/corazones")
  @UseGuards(JwtVecinoAuthGuard)
  misCorazonesEnComentarios(@Param("id") id: string, @Req() req: SolicitudConVecino): Promise<string[]> {
    return this.paraTi.misCorazonesEnComentarios(req.user.id, id);
  }

  @Post("publicaciones/:id/comentarios")
  @UseGuards(JwtVecinoAuthGuard)
  comentar(@Param("id") id: string, @Body() dto: ComentarDto, @Req() req: SolicitudConVecino): Promise<ComentarioPublicacion> {
    return this.paraTi.comentar(id, req.user.id, dto.texto, dto.respuestaA);
  }

  @Post("comentarios/:id/corazon")
  @UseGuards(JwtVecinoAuthGuard)
  darCorazonComentario(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.paraTi.corazonComentario(id, req.user.id, true);
  }

  @Delete("comentarios/:id/corazon")
  @UseGuards(JwtVecinoAuthGuard)
  quitarCorazonComentario(@Param("id") id: string, @Req() req: SolicitudConVecino) {
    return this.paraTi.corazonComentario(id, req.user.id, false);
  }

  @Post("comentarios/:id/reportar")
  @UseGuards(JwtVecinoAuthGuard)
  @HttpCode(204)
  async reportar(@Param("id") id: string, @Body() dto: ReportarComentarioDto, @Req() req: SolicitudConVecino): Promise<void> {
    await this.paraTi.reportarComentario(id, req.user.id, dto.motivo);
  }
}

const FILTROS: FiltroComentarios[] = ["reportados", "todos", "ocultos", "sin_responder"];

/** Panel: el super admin y el Editor de redes sociales administran todo el módulo. */
@Controller("para-ti/admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "editor_redes")
export class ParaTiAdminController {
  constructor(private readonly paraTi: ParaTiService) {}

  @Get("resumen")
  resumen(): Promise<MetricaParaTi[]> {
    return this.paraTi.resumen();
  }

  @Get("publicaciones")
  listar(): Promise<Publicacion[]> {
    return this.paraTi.listarAdmin();
  }

  @Get("publicaciones/:id")
  obtener(@Param("id") id: string): Promise<Publicacion> {
    return this.paraTi.obtener(id);
  }

  @Post("publicaciones")
  crear(@Body() dto: GuardarPublicacionDto, @Req() req: SolicitudConCuenta): Promise<Publicacion> {
    return this.paraTi.crear(dto, req.user.id);
  }

  @Patch("publicaciones/:id")
  actualizar(@Param("id") id: string, @Body() dto: GuardarPublicacionDto, @Req() req: SolicitudConCuenta): Promise<Publicacion> {
    return this.paraTi.actualizar(id, dto, req.user.id);
  }

  @Delete("publicaciones/:id")
  @HttpCode(204)
  async eliminar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<void> {
    await this.paraTi.eliminar(id, req.user.id);
  }

  @Patch("publicaciones/:id/comentarios")
  permitirComentarios(@Param("id") id: string, @Body() dto: PermitirComentariosDto, @Req() req: SolicitudConCuenta): Promise<Publicacion> {
    return this.paraTi.permitirComentarios(id, dto.permite, req.user.id);
  }

  @Get("publicaciones/:id/comentarios")
  hilo(@Param("id") id: string): Promise<ComentarioPublicacion[]> {
    return this.paraTi.comentariosDePublicacionAdmin(id);
  }

  @Post("publicaciones/:id/comentarios")
  comentarComoElisur(@Param("id") id: string, @Body() dto: ComentarElisurDto, @Req() req: SolicitudConCuenta): Promise<ComentarioPublicacion> {
    return this.paraTi.comentarComoElisur(id, req.user.id, dto.texto, dto.respuestaA, dto.fijar);
  }

  @Put("destacadas/orden")
  ordenarDestacadas(@Body() dto: OrdenDestacadasDto, @Req() req: SolicitudConCuenta): Promise<Publicacion[]> {
    return this.paraTi.ordenarDestacadas(dto.ids, req.user.id);
  }

  @Post("fotos")
  @UseInterceptors(FileInterceptor("foto", opcionesFoto))
  subirFoto(@UploadedFile() archivo: Express.Multer.File) {
    if (!archivo) throw new BadRequestException("Falta la foto.");
    return this.paraTi.subirFoto(archivo);
  }

  @Post("video/firmar")
  firmarVideo(@Body() dto: FirmarVideoDto) {
    return this.paraTi.firmarVideo(dto.nombre);
  }

  @Post("youtube")
  youtube(@Body() dto: EnlaceYoutubeDto) {
    return this.paraTi.vistaPreviaYoutube(dto.enlace);
  }

  @Get("comentarios/resumen")
  resumenComentarios(): Promise<ResumenComentarios> {
    return this.paraTi.resumenComentarios();
  }

  @Get("comentarios")
  comentarios(@Query("filtro") filtro?: string, @Query("q") q?: string): Promise<ComentarioPublicacion[]> {
    const f = FILTROS.includes(filtro as FiltroComentarios) ? (filtro as FiltroComentarios) : "reportados";
    return this.paraTi.comentariosAdmin(f, q);
  }

  @Patch("comentarios/:id")
  moderar(@Param("id") id: string, @Body() dto: ModerarComentarioDto, @Req() req: SolicitudConCuenta): Promise<ComentarioPublicacion> {
    return this.paraTi.moderarComentario(id, dto, req.user.id);
  }

  @Post("comentarios/:id/fijar")
  @HttpCode(204)
  async fijar(@Param("id") id: string, @Body() dto: FijarComentarioDto, @Req() req: SolicitudConCuenta): Promise<void> {
    await this.paraTi.fijarComentario(id, dto.fijado, req.user.id);
  }

  @Delete("comentarios/:id")
  @HttpCode(204)
  async eliminarComentario(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<void> {
    await this.paraTi.eliminarComentario(id, req.user.id);
  }

  @Post("silenciar")
  silenciar(@Body() dto: SilenciarDto, @Req() req: SolicitudConCuenta): Promise<{ hasta: string | null }> {
    return this.paraTi.silenciar(dto.usuarioId, dto.dias, req.user.id);
  }
}
