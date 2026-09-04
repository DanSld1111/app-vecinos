import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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
import { Cuenta, Negocio, Producto, ResultadoPaginado } from "@app-vecinos/tipos";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { NegociosService } from "./negocios.service";
import { ListarNegociosDto } from "./dto/listar-negocios.dto";
import { BuscarNegociosDto } from "./dto/buscar-negocios.dto";
import { CrearNegocioDto } from "./dto/crear-negocio.dto";
import { ActualizarInfoNegocioDto } from "./dto/actualizar-info-negocio.dto";
import { ActualizarHorariosDto } from "./dto/actualizar-horarios.dto";
import { AgregarOfertaDto } from "./dto/agregar-oferta.dto";
import { RechazarNegocioDto } from "./dto/rechazar-negocio.dto";
import { PaginacionAdminDto } from "../../comun/dto/paginacion-admin.dto";
import { opcionesUploadFotoNegocio } from "./foto-negocio.config";
import { opcionesUploadFotoProducto } from "./foto-producto.config";
import { AgregarFotoGaleriaDto } from "./dto/agregar-foto-galeria.dto";

type SolicitudConCuenta = { user: Cuenta };

@Controller("negocios")
export class NegociosController {
  constructor(private readonly negocios: NegociosService) {}

  @Get()
  listar(@Query() filtro: ListarNegociosDto): Promise<ResultadoPaginado<Negocio>> {
    return this.negocios.listar(filtro);
  }

  // Rutas literales antes de ":id" — si no, Nest las capturaría como un id.
  @Get("buscar")
  buscar(@Query() filtro: BuscarNegociosDto): Promise<Negocio[]> {
    return this.negocios.buscar(filtro.q, filtro.comunidadId, filtro.limite);
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  listarAdmin(@Query() paginacion: PaginacionAdminDto): Promise<ResultadoPaginado<Negocio>> {
    return this.negocios.listarAdmin(paginacion.cursor, paginacion.limite);
  }

  @Get("pendientes")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  listarPendientes(@Req() req: SolicitudConCuenta): Promise<Negocio[]> {
    return this.negocios.listarPendientes(req.user);
  }

  @Get("mios")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("dueno_negocio")
  listarMios(@Req() req: SolicitudConCuenta): Promise<Negocio[]> {
    return this.negocios.listarMios(req.user);
  }

  @Get("historial")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  listarHistorial(@Req() req: SolicitudConCuenta): Promise<Negocio[]> {
    return this.negocios.listarHistorial(req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  crear(@Body() dto: CrearNegocioDto): Promise<Negocio> {
    return this.negocios.crear(dto);
  }

  @Get(":id")
  async obtener(@Param("id") id: string): Promise<Negocio> {
    const negocio = await this.negocios.obtenerPorId(id);
    if (!negocio) throw new NotFoundException(`No existe un negocio con id "${id}"`);
    return negocio;
  }

  @Get(":id/productos")
  listarProductos(@Param("id") id: string): Promise<Producto[]> {
    return this.negocios.listarProductos(id);
  }

  @Patch(":id/aprobar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  aprobar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<Negocio> {
    return this.negocios.aprobar(id, req.user);
  }

  @Patch(":id/rechazar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  rechazar(
    @Param("id") id: string,
    @Body() dto: RechazarNegocioDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Negocio> {
    return this.negocios.rechazar(id, dto.motivo, req.user);
  }

  @Put(":id/info")
  @UseGuards(JwtAuthGuard)
  actualizarInfo(
    @Param("id") id: string,
    @Body() dto: ActualizarInfoNegocioDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Negocio> {
    return this.negocios.actualizarInfo(id, dto, req.user);
  }

  @Put(":id/horarios")
  @UseGuards(JwtAuthGuard)
  actualizarHorarios(
    @Param("id") id: string,
    @Body() dto: ActualizarHorariosDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Negocio> {
    return this.negocios.actualizarHorarios(id, dto, req.user);
  }

  @Post(":id/foto")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("foto", opcionesUploadFotoNegocio))
  actualizarFoto(
    @Param("id") id: string,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Req() req: SolicitudConCuenta,
  ): Promise<Negocio> {
    if (!archivo) throw new BadRequestException("Falta el archivo de la foto.");
    return this.negocios.actualizarFoto(id, archivo.filename, req.user);
  }

  @Post(":id/ofertas")
  @UseGuards(JwtAuthGuard)
  agregarOferta(
    @Param("id") id: string,
    @Body() dto: AgregarOfertaDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Negocio> {
    return this.negocios.agregarOferta(id, dto, req.user);
  }

  @Delete(":id/ofertas/:indice")
  @UseGuards(JwtAuthGuard)
  eliminarOferta(
    @Param("id") id: string,
    @Param("indice") indice: string,
    @Req() req: SolicitudConCuenta,
  ): Promise<Negocio> {
    return this.negocios.eliminarOferta(id, Number(indice), req.user);
  }

  @Post(":id/productos/:productoId/foto")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("foto", opcionesUploadFotoProducto))
  actualizarFotoProducto(
    @Param("id") id: string,
    @Param("productoId") productoId: string,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Req() req: SolicitudConCuenta,
  ): Promise<Producto> {
    if (!archivo) throw new BadRequestException("Falta el archivo de la foto.");
    return this.negocios.actualizarFotoProducto(id, productoId, archivo.filename, req.user);
  }

  @Post(":id/galeria")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("foto", opcionesUploadFotoNegocio))
  agregarFotoGaleria(
    @Param("id") id: string,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Req() req: SolicitudConCuenta,
  ): Promise<Negocio> {
    if (!archivo) throw new BadRequestException("Falta el archivo de la foto.");
    return this.negocios.agregarFotoGaleria(id, archivo.filename, req.user);
  }

  @Delete(":id/galeria")
  @UseGuards(JwtAuthGuard)
  eliminarFotoGaleria(
    @Param("id") id: string,
    @Body() dto: AgregarFotoGaleriaDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Negocio> {
    return this.negocios.eliminarFotoGaleria(id, dto.url, req.user);
  }
}
