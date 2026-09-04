import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient, QueryResultRow } from "pg";

export interface Consultable {
  consultar<T extends QueryResultRow = QueryResultRow>(
    texto: string,
    valores?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>;
}

@Injectable()
export class BaseDatosService implements OnModuleDestroy, Consultable {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  consultar<T extends QueryResultRow = QueryResultRow>(texto: string, valores: unknown[] = []) {
    return this.pool.query<T>(texto, valores);
  }

  /**
   * Para operaciones que tocan más de una tabla (ej. una cuenta y sus distritos
   * asignados): todo corre en una sola transacción o no corre nada.
   */
  async transaccion<T>(fn: (cliente: Consultable) => Promise<T>): Promise<T> {
    const cliente: PoolClient = await this.pool.connect();
    const envoltorio: Consultable = {
      consultar: (texto, valores = []) => cliente.query(texto, valores),
    };
    try {
      await cliente.query("BEGIN");
      const resultado = await fn(envoltorio);
      await cliente.query("COMMIT");
      return resultado;
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
