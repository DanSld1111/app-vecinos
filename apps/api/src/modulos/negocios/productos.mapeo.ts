import { Producto } from "@app-vecinos/tipos";

export interface FilaProducto {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion: string;
  precio: string; // NUMERIC llega como string desde pg — se convierte explícitamente
  categoria_menu: string;
  destacado: boolean;
  foto_url: string | null;
}

export function aProducto(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    negocioId: fila.negocio_id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    precio: Number(fila.precio),
    categoriaMenu: fila.categoria_menu,
    destacado: fila.destacado,
    fotoUrl: fila.foto_url,
  };
}
