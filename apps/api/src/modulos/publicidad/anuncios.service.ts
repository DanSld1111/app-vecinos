import { randomUUID } from "crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Anuncio } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { CrearAnuncioDto } from "./dto/crear-anuncio.dto";
import { ActualizarAnuncioDto } from "./dto/actualizar-anuncio.dto";
import { COLUMNAS_ANUNCIO, FilaAnuncio, aAnuncio } from "./anuncios.mapeo";
import { CARPETA_FOTOS_ANUNCIO } from "./foto-anuncio.config";

@Injectable()
export class AnunciosService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly auditoria: AuditoriaService,
    private readonly almacenamiento: AlmacenamientoService,
  ) {}

  /**
   * Lectura pública que consume la app del vecino: solo lo que de verdad debe verse ahora mismo
   * — activo y dentro de su rango de fechas. "Programado" y "vencido" son estados que solo le
   * importan al panel admin.
   */
  async listar(): Promise<Anuncio[]> {
    const { rows } = await this.bd.consultar<FilaAnuncio>(
      `SELECT ${COLUMNAS_ANUNCIO} FROM anuncios
       WHERE activo AND fecha_inicio <= CURRENT_DATE AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
       ORDER BY orden`,
    );
    return rows.map(aAnuncio);
  }

  /** Panel admin: todos, sin importar vigencia — así puede programar o revisar vencidos. */
  async listarAdmin(): Promise<Anuncio[]> {
    const { rows } = await this.bd.consultar<FilaAnuncio>(
      `SELECT ${COLUMNAS_ANUNCIO} FROM anuncios ORDER BY orden`,
    );
    return rows.map(aAnuncio);
  }

  private async obtenerFilaOFallar(id: string): Promise<FilaAnuncio> {
    const { rows } = await this.bd.consultar<FilaAnuncio>(
      `SELECT ${COLUMNAS_ANUNCIO} FROM anuncios WHERE id = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un anuncio con id "${id}"`);
    return rows[0];
  }

  async crear(dto: CrearAnuncioDto, cuentaQueActua: string): Promise<Anuncio> {
    const id = `anuncio-${randomUUID()}`;
    const { rows } = await this.bd.consultar<{ siguiente: number }>(
      "SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM anuncios",
    );
    await this.bd.consultar(
      `INSERT INTO anuncios (id, nombre, detalle, ubicaciones, negocio_id, fecha_inicio, fecha_fin, orden, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
      [
        id,
        dto.nombre,
        dto.detalle,
        dto.ubicaciones,
        dto.negocioId ?? null,
        dto.fechaInicio,
        dto.fechaFin ?? null,
        rows[0].siguiente,
      ],
    );
    await this.auditoria.registrar("crear", "anuncio", id, cuentaQueActua);
    return aAnuncio(await this.obtenerFilaOFallar(id));
  }

  async actualizar(id: string, dto: ActualizarAnuncioDto, cuentaQueActua: string): Promise<Anuncio> {
    await this.obtenerFilaOFallar(id);
    await this.bd.consultar(
      `UPDATE anuncios
       SET nombre = COALESCE($2, nombre),
           detalle = COALESCE($3, detalle),
           ubicaciones = COALESCE($4, ubicaciones),
           negocio_id = CASE WHEN $5 THEN $6 ELSE negocio_id END,
           fecha_inicio = COALESCE($7, fecha_inicio),
           fecha_fin = CASE WHEN $8 THEN $9 ELSE fecha_fin END,
           activo = COALESCE($10, activo)
       WHERE id = $1`,
      [
        id,
        dto.nombre ?? null,
        dto.detalle ?? null,
        dto.ubicaciones ?? null,
        "negocioId" in dto,
        dto.negocioId ?? null,
        dto.fechaInicio ?? null,
        "fechaFin" in dto,
        dto.fechaFin ?? null,
        dto.activo ?? null,
      ],
    );
    await this.auditoria.registrar("actualizar", "anuncio", id, cuentaQueActua, dto as Record<string, unknown>);
    return aAnuncio(await this.obtenerFilaOFallar(id));
  }

  async eliminar(id: string, cuentaQueActua: string): Promise<void> {
    const fila = await this.obtenerFilaOFallar(id);
    await this.bd.consultar("DELETE FROM anuncios WHERE id = $1", [id]);
    await this.auditoria.registrar("eliminar", "anuncio", id, cuentaQueActua);
    await this.almacenamiento.eliminarPorUrl(fila.imagen_url);
  }

  /** Igual que NegociosService.actualizarFoto: borra el archivo anterior de Supabase Storage al reemplazarlo. */
  async actualizarFoto(id: string, archivo: Express.Multer.File, cuentaQueActua: string): Promise<Anuncio> {
    const fila = await this.obtenerFilaOFallar(id);
    const anterior = fila.imagen_url;

    const url = await this.almacenamiento.subir(CARPETA_FOTOS_ANUNCIO, archivo.buffer, archivo.originalname, archivo.mimetype);
    await this.bd.consultar("UPDATE anuncios SET imagen_url = $2 WHERE id = $1", [id, url]);
    await this.auditoria.registrar("actualizar_foto", "anuncio", id, cuentaQueActua);
    await this.almacenamiento.eliminarPorUrl(anterior);

    return aAnuncio(await this.obtenerFilaOFallar(id));
  }
}
