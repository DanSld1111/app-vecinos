import { randomUUID } from "crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ServicioApp } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AlmacenamientoService } from "../../comun/almacenamiento/almacenamiento.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { ActualizarServicioDto } from "./dto/actualizar-servicio.dto";
import { CARPETA_FOTOS_SERVICIO } from "./foto-servicio.config";

interface FilaServicioApp {
  slug: string;
  nombre: string;
  descripcion: string;
  estado: ServicioApp["estado"];
  foto_url: string | null;
  orden: number;
  negocios: string;
  visitas_7d: string;
}

const COLUMNAS = `
  sa.slug, sa.nombre, sa.descripcion, sa.estado, sa.foto_url, sa.orden,
  (SELECT COUNT(DISTINCT n.id)
     FROM negocios n
     JOIN negocio_categorias nc ON nc.negocio_id = n.id
     JOIN categorias c ON c.id = nc.categoria_id
    WHERE c.servicio_slug = sa.slug AND n.estado = 'activo' AND n.archivado_en IS NULL) AS negocios,
  (SELECT COUNT(*) FROM servicio_visitas v
    WHERE v.servicio_slug = sa.slug AND v.creado_en > now() - interval '7 days') AS visitas_7d
`;

function aServicioApp(fila: FilaServicioApp): ServicioApp {
  return {
    slug: fila.slug,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    estado: fila.estado,
    fotoUrl: fila.foto_url,
    orden: fila.orden,
    negocios: Number(fila.negocios),
    visitas7d: Number(fila.visitas_7d),
  };
}

@Injectable()
export class ServiciosAppService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly auditoria: AuditoriaService,
    private readonly almacenamiento: AlmacenamientoService,
  ) {}

  /**
   * Sin paginación a propósito, igual que categorías: es el catálogo fijo de servicios de la
   * app (12 filas hoy, uno por cada tarjeta de la pantalla Servicios), no algo que crezca sin
   * límite.
   */
  async listar(): Promise<ServicioApp[]> {
    const { rows } = await this.bd.consultar<FilaServicioApp>(
      `SELECT ${COLUMNAS} FROM servicios_app sa ORDER BY sa.orden`,
    );
    return rows.map(aServicioApp);
  }

  /** Un renglón por apertura de la pantalla de un servicio — público, sin cuenta. Ver
   * docs/decisiones/0074-servicios-real.md. */
  async registrarVisita(slug: string): Promise<void> {
    await this.bd.consultar("INSERT INTO servicio_visitas (id, servicio_slug) VALUES ($1, $2)", [
      `visita-servicio-${randomUUID()}`,
      slug,
    ]);
  }

  private async obtenerFilaOFallar(slug: string): Promise<FilaServicioApp> {
    const { rows } = await this.bd.consultar<FilaServicioApp>(
      `SELECT ${COLUMNAS} FROM servicios_app sa WHERE sa.slug = $1`,
      [slug],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un servicio con slug "${slug}"`);
    return rows[0];
  }

  async actualizar(slug: string, dto: ActualizarServicioDto, cuentaQueActua: string): Promise<ServicioApp> {
    await this.obtenerFilaOFallar(slug);
    await this.bd.consultar(
      `UPDATE servicios_app
       SET nombre = COALESCE($2, nombre),
           descripcion = COALESCE($3, descripcion),
           estado = COALESCE($4, estado)
       WHERE slug = $1`,
      [slug, dto.nombre ?? null, dto.descripcion ?? null, dto.estado ?? null],
    );
    await this.auditoria.registrar("actualizar", "servicio_app", slug, cuentaQueActua, dto as Record<string, unknown>);
    return aServicioApp(await this.obtenerFilaOFallar(slug));
  }

  /** Igual que NegociosService.actualizarFoto: borra el archivo anterior de Supabase Storage al reemplazarlo. */
  async actualizarFoto(slug: string, archivo: Express.Multer.File, cuentaQueActua: string): Promise<ServicioApp> {
    const fila = await this.obtenerFilaOFallar(slug);
    const anterior = fila.foto_url;

    const url = await this.almacenamiento.subir(CARPETA_FOTOS_SERVICIO, archivo.buffer, archivo.originalname, archivo.mimetype);
    await this.bd.consultar(`UPDATE servicios_app SET foto_url = $2 WHERE slug = $1`, [slug, url]);
    await this.auditoria.registrar("actualizar_foto", "servicio_app", slug, cuentaQueActua);
    await this.almacenamiento.eliminarPorUrl(anterior);

    return aServicioApp(await this.obtenerFilaOFallar(slug));
  }
}
