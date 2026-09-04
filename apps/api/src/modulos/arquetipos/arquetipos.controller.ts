import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Arquetipo } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ArquetiposService } from "./arquetipos.service";
import { CrearArquetipoDto } from "./dto/crear-arquetipo.dto";
import { ActualizarArquetipoDto } from "./dto/actualizar-arquetipo.dto";

/** Solo panel admin — ver el comentario en arquetipos.service.ts sobre por qué no hay ruta pública. */
@Controller("arquetipos")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
export class ArquetiposController {
  constructor(private readonly arquetipos: ArquetiposService) {}

  @Get()
  listar(): Promise<Arquetipo[]> {
    return this.arquetipos.listarTodos();
  }

  @Post()
  crear(@Body() dto: CrearArquetipoDto): Promise<Arquetipo> {
    return this.arquetipos.crear(dto);
  }

  @Patch(":id")
  actualizar(@Param("id") id: string, @Body() dto: ActualizarArquetipoDto): Promise<Arquetipo> {
    return this.arquetipos.actualizar(id, dto);
  }

  @Delete(":id")
  async eliminar(@Param("id") id: string): Promise<{ ok: true }> {
    await this.arquetipos.eliminar(id);
    return { ok: true };
  }
}
