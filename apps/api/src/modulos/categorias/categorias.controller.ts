import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Categoria } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CategoriasService } from "./categorias.service";
import { CrearCategoriaDto } from "./dto/crear-categoria.dto";
import { ActualizarCategoriaDto } from "./dto/actualizar-categoria.dto";
import { opcionesUploadFotoCategoria } from "./foto-categoria.config";

@Controller("categorias")
export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Get()
  listar(): Promise<Categoria[]> {
    return this.categorias.listarTodas();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  crear(@Body() dto: CrearCategoriaDto): Promise<Categoria> {
    return this.categorias.crear(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  actualizar(@Param("id") id: string, @Body() dto: ActualizarCategoriaDto): Promise<Categoria> {
    return this.categorias.actualizar(id, dto);
  }

  @Post(":id/foto")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @UseInterceptors(FileInterceptor("foto", opcionesUploadFotoCategoria))
  actualizarFoto(
    @Param("id") id: string,
    @UploadedFile() archivo: Express.Multer.File | undefined,
  ): Promise<Categoria> {
    if (!archivo) throw new BadRequestException("Falta el archivo de la foto.");
    return this.categorias.actualizarFoto(id, archivo);
  }
}
