import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Anuncio, Cuenta } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AnunciosService } from "./anuncios.service";
import { CrearAnuncioDto } from "./dto/crear-anuncio.dto";
import { ActualizarAnuncioDto } from "./dto/actualizar-anuncio.dto";
import { opcionesUploadFotoAnuncio } from "./foto-anuncio.config";

type SolicitudConCuenta = { user: Cuenta };

/** Espacios de publicidad interna de apps/movil (carrusel de Inicio, banner de Buscar) — ver docs/decisiones/0028-fotos-productos-galeria-y-publicidad.md. */
@Controller("anuncios")
export class AnunciosController {
  constructor(private readonly anuncios: AnunciosService) {}

  @Get()
  listar(): Promise<Anuncio[]> {
    return this.anuncios.listar();
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  listarAdmin(): Promise<Anuncio[]> {
    return this.anuncios.listarAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  crear(@Body() dto: CrearAnuncioDto, @Req() req: SolicitudConCuenta): Promise<Anuncio> {
    return this.anuncios.crear(dto, req.user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  actualizar(
    @Param("id") id: string,
    @Body() dto: ActualizarAnuncioDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Anuncio> {
    return this.anuncios.actualizar(id, dto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  async eliminar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<{ ok: true }> {
    await this.anuncios.eliminar(id, req.user.id);
    return { ok: true };
  }

  @Post(":id/foto")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @UseInterceptors(FileInterceptor("foto", opcionesUploadFotoAnuncio))
  actualizarFoto(
    @Param("id") id: string,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Req() req: SolicitudConCuenta,
  ): Promise<Anuncio> {
    if (!archivo) throw new BadRequestException("Falta el archivo de la foto.");
    return this.anuncios.actualizarFoto(id, archivo, req.user.id);
  }
}
