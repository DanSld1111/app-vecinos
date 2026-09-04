import { Injectable } from "@nestjs/common";
import { Profesional, ResultadoPaginado } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { COLUMNAS_PROFESIONAL, FilaProfesional, aProfesional } from "./profesionales.mapeo";
import { ListarProfesionalesDto } from "./dto/listar-profesionales.dto";

interface CursorProfesional {
  nombre: string;
  id: string;
}

function codificarCursor(cursor: CursorProfesional): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodificarCursor(cursor: string | undefined): CursorProfesional | null {
  if (!cursor) return null;
  try {
    const datos = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    return typeof datos.nombre === "string" && typeof datos.id === "string" ? datos : null;
  } catch {
    return null;
  }
}

@Injectable()
export class ProfesionalesService {
  constructor(private readonly bd: BaseDatosService) {}

  /**
   * Solo profesionales 'activo': lectura pública, mismo criterio que negocios — un registro
   * desactivado (colegiatura vencida, dado de baja) nunca debe llegarle a un vecino.
   * Paginado por (nombre, id) en vez de fecha de creación: la tabla no tiene creado_en
   * (ver infraestructura/migraciones/0006_contenido.sql) y para un directorio profesional
   * el orden alfabético es el que tiene sentido para el vecino que busca.
   */
  async listar(filtro: ListarProfesionalesDto): Promise<ResultadoPaginado<Profesional>> {
    const condiciones = ["comunidad_id = $1", "activo = true"];
    const valores: unknown[] = [filtro.comunidadId];

    if (filtro.tipo) {
      valores.push(filtro.tipo);
      condiciones.push(`tipo = $${valores.length}`);
    }

    const cursor = decodificarCursor(filtro.cursor);
    if (cursor) {
      valores.push(cursor.nombre, cursor.id);
      condiciones.push(`(nombre, id) > ($${valores.length - 1}, $${valores.length})`);
    }

    const limite = filtro.limite ?? 20;
    valores.push(limite + 1);

    const { rows } = await this.bd.consultar<FilaProfesional>(
      `SELECT ${COLUMNAS_PROFESIONAL} FROM profesionales
       WHERE ${condiciones.join(" AND ")}
       ORDER BY nombre ASC, id ASC
       LIMIT $${valores.length}`,
      valores,
    );

    const hayMas = rows.length > limite;
    const items = rows.slice(0, limite).map(aProfesional);
    const ultimo = items[items.length - 1];
    const cursorSiguiente = hayMas && ultimo ? codificarCursor({ nombre: ultimo.nombre, id: ultimo.id }) : null;
    return { items, cursorSiguiente };
  }

  async obtenerPorId(id: string): Promise<Profesional | null> {
    const { rows } = await this.bd.consultar<FilaProfesional>(
      `SELECT ${COLUMNAS_PROFESIONAL} FROM profesionales WHERE id = $1 AND activo = true`,
      [id],
    );
    return rows[0] ? aProfesional(rows[0]) : null;
  }
}
