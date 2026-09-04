import {
  BadRequestException,
  Body,
  Controller,
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
import { Cuenta, ServicioApp } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ServiciosAppService } from "./servicios-app.service";
import { ActualizarServicioDto } from "./dto/actualizar-servicio.dto";
import { opcionesUploadFotoServicio } from "./foto-servicio.config";

type SolicitudConCuenta = { user: Cuenta };

/** Contenido editable de la pantalla "Servicios" de apps/movil — ver docs/decisiones/0025-servicios-editables-desde-admin.md. */
@Controller("servicios-app")
export class ServiciosAppController {
  constructor(private readonly servicios: ServiciosAppService) {}

  @Get()
  listar(): Promise<ServicioApp[]> {
    return this.servicios.listar();
  }

  @Patch(":slug")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  actualizar(
    @Param("slug") slug: string,
    @Body() dto: ActualizarServicioDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<ServicioApp> {
    return this.servicios.actualizar(slug, dto, req.user.id);
  }

  @Post(":slug/foto")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @UseInterceptors(FileInterceptor("foto", opcionesUploadFotoServicio))
  actualizarFoto(
    @Param("slug") slug: string,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Req() req: SolicitudConCuenta,
  ): Promise<ServicioApp> {
    if (!archivo) throw new BadRequestException("Falta el archivo de la foto.");
    return this.servicios.actualizarFoto(slug, archivo.filename, req.user.id);
  }
}
