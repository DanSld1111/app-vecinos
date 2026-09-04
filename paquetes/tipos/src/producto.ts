export interface Producto {
  id: string;
  negocioId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaMenu: string;
  destacado: boolean;
  fotoUrl: string | null;
}
