import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Cuenta, ResultadoPaginado, RolCuenta } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CuentasService } from "./cuentas.service";
import { CrearCuentaDto } from "./dto/crear-cuenta.dto";
import { ActualizarCuentaDto } from "./dto/actualizar-cuenta.dto";
import { RestablecerClaveDto } from "./dto/restablecer-clave.dto";
import { ActualizarPerfilDto } from "./dto/actualizar-perfil.dto";
import { CambiarClaveDto } from "./dto/cambiar-clave.dto";
import { PaginacionAdminDto } from "../../comun/dto/paginacion-admin.dto";
import { opcionesUploadFotoCuenta } from "./foto-cuenta.config";

/** Cualquier rol autenticado puede autoservirse su propia cuenta — ver rutas /cuentas/yo/... */
const TODOS_LOS_ROLES: RolCuenta[] = [
  "super_admin",
  "dueno_negocio",
  "junta_vecinal",
  "validador_contenido",
  "gestor_negocios",
];

type SolicitudConCuenta = { user: Cuenta };

/**
 * Gestión de cuentas del panel: hoy solo super_admin puede crear/editar/desactivar otras
 * cuentas — mismo criterio que ya aplicaba apps/admin/src/paginas/Cuentas.tsx sobre el mock.
 */
@Controller("cuentas")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
export class CuentasController {
  constructor(private readonly cuentas: CuentasService) {}

  /**
   * gestor_negocios también llega acá — únicamente para elegir a qué cuenta "dueño de
   * negocio" vincular un negocio. `soloRol` no viene del cliente: se decide aquí según quién
   * pregunta, así un gestor nunca ve validadores, otros gestores ni cuentas de super_admin.
   */
  @Get()
  @Roles("super_admin", "gestor_negocios")
  listar(@Query() paginacion: PaginacionAdminDto, @Req() req: SolicitudConCuenta): Promise<ResultadoPaginado<Cuenta>> {
    const soloRol = req.user.rol === "gestor_negocios" ? "dueno_negocio" : undefined;
    return this.cuentas.listar(paginacion.cursor, paginacion.limite, soloRol);
  }

  // "yo" antes de ":id" a propósito — si no, Nest lo capturaría como un id literal. Estas
  // cuatro rutas son autoservicio de "Mi cuenta": cualquier rol autenticado las usa sobre sí
  // mismo, no solo super_admin (por eso el @Roles(...TODOS_LOS_ROLES) que pisa el de la clase).
  @Put("yo")
  @Roles(...TODOS_LOS_ROLES)
  actualizarPerfilPropio(@Body() dto: ActualizarPerfilDto, @Req() req: SolicitudConCuenta): Promise<Cuenta> {
    return this.cuentas.actualizarPerfilPropio(req.user.id, dto);
  }

  @Post("yo/clave")
  @Roles(...TODOS_LOS_ROLES)
  @HttpCode(204)
  async cambiarClavePropia(@Body() dto: CambiarClaveDto, @Req() req: SolicitudConCuenta): Promise<void> {
    await this.cuentas.cambiarClavePropia(req.user.id, dto.claveActual, dto.claveNueva);
  }

  @Post("yo/foto")
  @Roles(...TODOS_LOS_ROLES)
  @UseInterceptors(FileInterceptor("foto", opcionesUploadFotoCuenta))
  actualizarFotoPropia(
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Req() req: SolicitudConCuenta,
  ): Promise<Cuenta> {
    if (!archivo) throw new BadRequestException("Falta el archivo de la foto.");
    return this.cuentas.actualizarFotoPropia(req.user.id, archivo);
  }

  /** gestor_negocios también crea cuentas — con el rol forzado a "dueño de negocio" dentro
   * del service, no aquí: ver CuentasService.crear(). */
  @Post()
  @Roles("super_admin", "gestor_negocios")
  crear(@Body() dto: CrearCuentaDto, @Req() req: SolicitudConCuenta): Promise<Cuenta> {
    return this.cuentas.crear(dto, req.user.id, req.user.rol);
  }

  @Put(":id")
  actualizar(@Param("id") id: string, @Body() dto: ActualizarCuentaDto): Promise<Cuenta> {
    return this.cuentas.actualizar(id, dto);
  }

  /**
   * Angosto a propósito: vincula o quita UN negocio de UNA cuenta "dueño de negocio", nada
   * más — a diferencia de PUT /cuentas/:id (que puede cambiar nombre, correo y rol de
   * cualquier cuenta), esta es la única puerta que se abrió para gestor_negocios.
   */
  @Patch(":id/negocios/:negocioId")
  @Roles("super_admin", "gestor_negocios")
  vincularNegocio(
    @Param("id") id: string,
    @Param("negocioId") negocioId: string,
    @Req() req: SolicitudConCuenta,
  ): Promise<Cuenta> {
    return this.cuentas.vincularNegocio(id, negocioId, req.user.id);
  }

  @Delete(":id/negocios/:negocioId")
  @Roles("super_admin", "gestor_negocios")
  desvincularNegocio(
    @Param("id") id: string,
    @Param("negocioId") negocioId: string,
    @Req() req: SolicitudConCuenta,
  ): Promise<Cuenta> {
    return this.cuentas.desvincularNegocio(id, negocioId, req.user.id);
  }

  @Delete(":id")
  @HttpCode(204)
  async eliminar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<void> {
    await this.cuentas.eliminar(id, req.user.id);
  }

  @Patch(":id/alternar-activo")
  alternarActivo(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<Cuenta> {
    return this.cuentas.alternarActivo(id, req.user.id);
  }

  @Post(":id/restablecer-clave")
  @HttpCode(204)
  async restablecerClave(
    @Param("id") id: string,
    @Body() dto: RestablecerClaveDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<void> {
    await this.cuentas.restablecerClave(id, dto.nuevaContrasena, req.user.id);
  }
}
