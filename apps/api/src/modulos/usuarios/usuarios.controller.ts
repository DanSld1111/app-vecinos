import { Controller, Delete, Get, HttpCode, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { Cuenta, ResultadoPaginado, UsuarioApp } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UsuariosService } from "./usuarios.service";
import { PaginacionAdminDto } from "../../comun/dto/paginacion-admin.dto";

type SolicitudConCuenta = { user: Cuenta };

/** Vecinos registrados desde la app móvil — gestión reservada al super-admin, igual que hoy en apps/admin/src/paginas/Usuarios.tsx. */
@Controller("usuarios")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar(@Query() paginacion: PaginacionAdminDto): Promise<ResultadoPaginado<UsuarioApp>> {
    return this.usuarios.listar(paginacion.cursor, paginacion.limite);
  }

  @Patch(":id/alternar-bloqueo")
  alternarBloqueo(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<UsuarioApp> {
    return this.usuarios.alternarBloqueo(id, req.user.id);
  }

  @Delete(":id")
  @HttpCode(204)
  async eliminar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<void> {
    await this.usuarios.eliminar(id, req.user.id);
  }
}
