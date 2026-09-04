import { Injectable, NotFoundException } from "@nestjs/common";
import { ResultadoPaginado, UsuarioApp } from "@app-vecinos/tipos";
import { BaseDatosService } from "../../comun/base-datos/base-datos.service";
import { AuditoriaService } from "../../comun/auditoria/auditoria.service";
import { codificarCursor, decodificarCursor } from "../../comun/paginacion";
import { SELECT_USUARIO_APP, FilaUsuarioApp, aUsuarioApp } from "./usuarios.mapeo";

@Injectable()
export class UsuariosService {
  constructor(
    private readonly bd: BaseDatosService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /** Antes traía todo sin límite (ver docs/decisiones/0021-endurecimiento-post-diagnostico.md). */
  async listar(cursor: string | undefined, limite: number): Promise<ResultadoPaginado<UsuarioApp>> {
    const condiciones = ["eliminado_en IS NULL"];
    const valores: unknown[] = [];

    const cursorDecodificado = decodificarCursor(cursor);
    if (cursorDecodificado) {
      valores.push(cursorDecodificado.creadoEn, cursorDecodificado.id);
      condiciones.push(`(registrado_en, id) < ($${valores.length - 1}, $${valores.length})`);
    }
    valores.push(limite + 1);

    const { rows } = await this.bd.consultar<FilaUsuarioApp>(
      `${SELECT_USUARIO_APP}
       WHERE ${condiciones.join(" AND ")}
       ORDER BY registrado_en DESC, id DESC
       LIMIT $${valores.length}`,
      valores,
    );

    const hayMas = rows.length > limite;
    const items = rows.slice(0, limite).map(aUsuarioApp);
    const ultimo = items[items.length - 1];
    const cursorSiguiente = hayMas && ultimo ? codificarCursor({ creadoEn: ultimo.registradoEn, id: ultimo.id }) : null;
    return { items, cursorSiguiente };
  }

  async alternarBloqueo(id: string, cuentaQueActua: string): Promise<UsuarioApp> {
    const { rows } = await this.bd.consultar<FilaUsuarioApp>(
      `UPDATE usuarios_app
       SET estado = (CASE WHEN estado = 'activo' THEN 'bloqueado' ELSE 'activo' END)::estado_usuario_app
       WHERE id = $1 AND eliminado_en IS NULL
       RETURNING id, nombre, apellido, correo, telefono, comunidad_id, estado, registrado_en, ultimo_acceso_en`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`No existe un vecino con id "${id}"`);
    const usuario = aUsuarioApp(rows[0]);
    await this.auditoria.registrar("alternar-bloqueo", "usuario_app", id, cuentaQueActua, { estado: usuario.estado });
    return usuario;
  }

  /**
   * Baja lógica, no DELETE físico — mismo criterio que cuentas.service.ts. El vecino deja de
   * poder iniciar sesión (vecinos-auth.service.ts ya filtra eliminado_en) y desaparece de
   * este listado, pero el registro queda por si hace falta revertir o auditar.
   */
  async eliminar(id: string, cuentaQueActua: string): Promise<void> {
    const { rowCount } = await this.bd.consultar(
      "UPDATE usuarios_app SET eliminado_en = now() WHERE id = $1 AND eliminado_en IS NULL",
      [id],
    );
    if (!rowCount) throw new NotFoundException(`No existe un vecino con id "${id}"`);
    await this.auditoria.registrar("eliminar", "usuario_app", id, cuentaQueActua);
  }
}
