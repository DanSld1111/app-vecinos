import { Producto, TourConAgencia } from "@app-vecinos/tipos";
import { RepositorioProductos } from "../contratos/repositorioProductos";
import { apiGet } from "./clienteApi";

export class RepositorioProductosApi implements RepositorioProductos {
  async listarPorNegocio(negocioId: string): Promise<Producto[]> {
    return (await apiGet<Producto[] | null>(`/negocios/${negocioId}/productos`)) ?? [];
  }

  async listarTours(comunidadId: string): Promise<TourConAgencia[]> {
    return (await apiGet<TourConAgencia[] | null>(`/negocios/tours?comunidadId=${encodeURIComponent(comunidadId)}`)) ?? [];
  }
}
