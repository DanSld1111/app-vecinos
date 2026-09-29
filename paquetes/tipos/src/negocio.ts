import { Coordenada } from "./geografia";
import { Moneda } from "./comun";

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
  /** Opcional — solo cuando ayuda a mostrar el servicio (un corte de cabello, un ambiente).
   * Un trámite (una declaración, un certificado) normalmente no la necesita. */
  fotoUrl?: string | null;
}

export interface OfertaNegocio {
  nombre: string;
  precio: number;
  /** Precio antes del descuento, para mostrarlo tachado. Si no se define, no se muestra comparación. */
  precioOriginal?: number;
  etiqueta: string;
}

/** Cómo estaba la ficha cuando la rechazaron: el validador la compara al recibir el reenvío (decisión 0086). */
export interface VersionRechazadaNegocio {
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string | null;
  whatsapp: string | null;
  fotoPrincipalUrl: string | null;
  horarios: Horarios;
  categoriaIds: string[];
  motivoRechazo: string | null;
  rechazadoEn: string;
}

/** Un renglón del historial de un negocio (pestaña Historial del panel). */
export interface EventoHistorialNegocio {
  accion: string;
  entidad: "negocio" | "producto";
  detalle: Record<string, unknown> | null;
  creadoEn: string;
  cuentaNombre: string | null;
  cuentaRol: string | null;
  /** Solo en la actividad del inicio del gestor: de qué negocio es. */
  negocioId?: string;
  negocioNombre?: string;
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
  /** Moneda de todos los precios de este negocio (productos, ofertas y servicios). */
  moneda: Moneda;
  fotoPrincipalUrl: string | null;
  estado: EstadoNegocio;
  /** Archivado (reversible, distinto de "despublicado"): retirado del listado y de la búsqueda
   * hasta que alguien lo restaure. null = no archivado. Ver docs/decisiones/0071. */
  archivadoEn: string | null;
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
  /** Visitas a la ficha en los últimos 7 días — sube con POST /negocios/:id/visitas. Se usa para
   * el badge "Popular" y como desempate al ordenar por distancia en Inicio. Ver
   * docs/decisiones/0073-inicio-orden-real.md. */
  visitas7d: number;
  /** Solo viene cuando `listar()` recibió `lat`/`lng` (la ubicación real del vecino) — metros en
   * línea recta desde ahí hasta el negocio. undefined si no se pidió con ubicación. */
  distanciaM?: number;
  /** Texto libre que escribe el propio dueño desde el panel — se muestra en "Información del
   * negocio". null mientras no lo complete (nunca se inventa un texto por defecto). */
  acercaDelNegocio: string | null;
  /** null = todavía nadie lo calificó — nunca se muestra "0.0", se muestra "Sé el primero en
   * calificar". Ver docs/decisiones/0076-calificacion-estrellas.md. */
  calificacionPromedio: number | null;
  calificacionTotal: number;
  /** Productos visibles (sin contar la papelera). Lo usa el panel para saber si la ficha tiene
   * contenido (decisión 0085). Opcional: los datos de ejemplo del modo sin conexión no lo traen. */
  totalProductos?: number;
  /** Solo si se reenvió tras un rechazo y todavía no se aprueba. */
  versionRechazada?: VersionRechazadaNegocio | null;
  notaReenvio?: string | null;
  /** Quién lo registró (null en negocios anteriores a la decisión 0086). */
  creadoPorCuentaId?: string | null;
}

export interface FiltroNegocios {
  comunidadId: string;
  categoriaId?: string;
  /** Trae los negocios de TODAS las categorías de este servicio (Restaurantes, Market Space…) —
   * distinto de categoriaId, que es una sola categoría suelta. Ver
   * docs/decisiones/0072-servicio-dueno-de-categoria.md. */
  servicioSlug?: string;
  busqueda?: string;
  cursor?: string;
  limite?: number;
  /** Ubicación real del vecino (GPS del dispositivo) — si vienen los dos, `listar()` ordena por
   * distancia real (con un tope de 6 km) en vez de por fecha de alta, y cada Negocio trae
   * `distanciaM`. Ver docs/decisiones/0073-inicio-orden-real.md. */
  lat?: number;
  lng?: number;
}
