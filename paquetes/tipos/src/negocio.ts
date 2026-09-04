import { Coordenada } from "./geografia";

export type DiaSemana =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export interface HorarioDia {
  cerrado: boolean;
  abre?: string;
  cierra?: string;
}

export type Horarios = Record<DiaSemana, HorarioDia>;

export type EstadoNegocio = "activo" | "inactivo" | "por_verificar";

export interface ServicioOfrecido {
  nombre: string;
  detalle?: string;
  precio: number;
}

export interface OfertaNegocio {
  nombre: string;
  precio: number;
  /** Precio antes del descuento, para mostrarlo tachado. Si no se define, no se muestra comparación. */
  precioOriginal?: number;
  etiqueta: string;
}

export interface Negocio {
  id: string;
  comunidadId: string;
  distritoUbigeo: string;
  nombre: string;
  descripcion: string;
  categoriaIds: string[];
  coordenada: Coordenada;
  direccion: string;
  telefono: string | null;
  whatsapp: string | null;
  horarios: Horarios;
  fotoPrincipalUrl: string | null;
  estado: EstadoNegocio;
  verificadoEn: string | null;
  /** Cuenta (Validador de contenido) que aprobó o rechazó el último envío. null mientras esté "por_verificar". */
  validadoPorCuentaId: string | null;
  /** Motivo del último rechazo, para que el dueño pueda corregir y reenviar. null si nunca fue rechazado. */
  motivoRechazo: string | null;
  fuente: string;
  creadoEn: string;
  actualizadoEn: string;
  /** Arquetipo "servicios": lista de servicios con tarifa (lavanderías, veterinarias, etc.). */
  serviciosOfrecidos?: ServicioOfrecido[];
  /** Arquetipo "categorias": rubros que maneja el negocio, sin precio (ferreterías, bazares). */
  rubrosDisponibles?: string[];
  /** Ofertas destacadas del negocio en este momento. Cualquier negocio puede tener, no solo supermercados — se usan en el arquetipo "ofertas" de su ficha y se juntan entre todos los negocios en el carrusel de Buscar. */
  ofertas?: OfertaNegocio[];
  /** Arquetipo "ofertas": pasillos/categorías del local (propio de supermercados). */
  pasillos?: string[];
  /** Galería genérica (fachada, interior, etc.) — solo se usa en la ficha cuando el negocio no tiene menú/catálogo/servicios/ofertas. Hasta 6 fotos. */
  fotosGaleria: string[];
}

export interface FiltroNegocios {
  comunidadId: string;
  categoriaId?: string;
  busqueda?: string;
  cursor?: string;
  limite?: number;
}
