import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { GuardarProductoDto } from "./dto/guardar-producto.dto";
import { ReordenarProductosDto } from "./dto/reordenar-productos.dto";

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

  /**
   * Igual que el anterior pero sin filtrar por estado: la ficha del panel necesita abrir
   * negocios que todavía no se publicaron (el endpoint público solo devuelve los activos).
   */
  @Get(":id/admin")
  @UseGuards(JwtAuthGuard)
  obtenerParaAdmin(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<Negocio> {
    return this.negocios.obtenerParaAdmin(id, req.user);
  }

  @Get(":id/productos")
  listarProductos(@Param("id") id: string): Promise<Producto[]> {
    return this.negocios.listarProductos(id);
  }

  // Rutas literales antes de las que llevan ":productoId" — si no, Nest tomaría "papelera" y
  // "orden" como si fueran ids de producto.
  @Get(":id/productos/papelera")
  @UseGuards(JwtAuthGuard)
  listarProductosPapelera(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<Producto[]> {
    return this.negocios.listarProductosPapelera(id, req.user);
  }

  @Put(":id/productos/orden")
  @UseGuards(JwtAuthGuard)
  reordenarProductos(
    @Param("id") id: string,
    @Body() dto: ReordenarProductosDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Producto[]> {
    return this.negocios.reordenarProductos(id, dto.idsEnOrden, req.user);
  }

  @Post(":id/productos")
  @UseGuards(JwtAuthGuard)
  crearProducto(
    @Param("id") id: string,
    @Body() dto: GuardarProductoDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Producto> {
    return this.negocios.crearProducto(id, dto, req.user);
  }

  @Put(":id/productos/:productoId")
  @UseGuards(JwtAuthGuard)
  actualizarProducto(
    @Param("id") id: string,
    @Param("productoId") productoId: string,
    @Body() dto: GuardarProductoDto,
    @Req() req: SolicitudConCuenta,
  ): Promise<Producto> {
    return this.negocios.actualizarProducto(id, productoId, dto, req.user);
  }

  /** A la papelera — recuperable con el endpoint de restaurar. */
  @Delete(":id/productos/:productoId")
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async eliminarProducto(
    @Param("id") id: string,
    @Param("productoId") productoId: string,
    @Req() req: SolicitudConCuenta,
  ): Promise<void> {
    await this.negocios.eliminarProducto(id, productoId, req.user);
  }

  @Patch(":id/productos/:productoId/restaurar")
  @UseGuards(JwtAuthGuard)
  restaurarProducto(
    @Param("id") id: string,
    @Param("productoId") productoId: string,
    @Req() req: SolicitudConCuenta,
  ): Promise<Producto> {
    return this.negocios.restaurarProducto(id, productoId, req.user);
  }

  /** Borrado real (fila + foto). Solo desde la papelera, sin vuelta atrás. */
  @Delete(":id/productos/:productoId/definitivo")
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async eliminarProductoDefinitivo(
    @Param("id") id: string,
    @Param("productoId") productoId: string,
    @Req() req: SolicitudConCuenta,
  ): Promise<void> {
    await this.negocios.eliminarProductoDefinitivo(id, productoId, req.user);
  }

  @Delete(":id/productos/:productoId/foto")
  @UseGuards(JwtAuthGuard)
  quitarFotoProducto(
    @Param("id") id: string,
    @Param("productoId") productoId: string,
    @Req() req: SolicitudConCuenta,
  ): Promise<Producto> {
    return this.negocios.quitarFotoProducto(id, productoId, req.user);
  }

  @Patch(":id/aprobar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  aprobar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<Negocio> {
    return this.negocios.aprobar(id, req.user);
  }

  @Patch(":id/despublicar")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("validador_contenido", "super_admin")
  despublicar(@Param("id") id: string, @Req() req: SolicitudConCuenta): Promise<Negocio> {
    return this.negocios.despublicar(id, req.user);
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
    return this.negocios.actualizarFoto(id, archivo, req.user);
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
    return this.negocios.actualizarFotoProducto(id, productoId, archivo, req.user);
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
    return this.negocios.agregarFotoGaleria(id, archivo, req.user);
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
