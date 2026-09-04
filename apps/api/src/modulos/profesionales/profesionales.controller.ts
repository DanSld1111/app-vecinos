import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { Profesional, ResultadoPaginado } from "@app-vecinos/tipos";
import { ProfesionalesService } from "./profesionales.service";
import { ListarProfesionalesDto } from "./dto/listar-profesionales.dto";

@Controller("profesionales")
export class ProfesionalesController {
  constructor(private readonly profesionales: ProfesionalesService) {}

  @Get()
  listar(@Query() filtro: ListarProfesionalesDto): Promise<ResultadoPaginado<Profesional>> {
    return this.profesionales.listar(filtro);
  }

  @Get(":id")
  async obtener(@Param("id") id: string): Promise<Profesional> {
    const profesional = await this.profesionales.obtenerPorId(id);
    if (!profesional) throw new NotFoundException(`No existe un profesional con id "${id}"`);
    return profesional;
  }
}
