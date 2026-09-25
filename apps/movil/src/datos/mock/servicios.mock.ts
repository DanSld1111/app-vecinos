import { ServicioApp } from "@app-vecinos/tipos";
import { categoriasMock } from "./categorias.mock";
import { negociosMock } from "./negocios.mock";

/** Visitas de ejemplo de los últimos 7 días, a mano — así "Explora por rubro" se ve ordenado por
 * uso real en vez de todos en cero en el modo mock. */
const VISITAS_7D_MOCK: Record<string, number> = {
  restaurantes: 19,
  "market-space": 11,
  supermarket: 6,
};

function contarNegocios(slug: string): number {
  const categoriaIdsDelServicio = categoriasMock.filter((c) => c.servicioSlug === slug).map((c) => c.id);
  return negociosMock.filter((n) => n.categoriaIds.some((id) => categoriaIdsDelServicio.includes(id))).length;
}

// Mismo contenido que la semilla real (infraestructura/migraciones/0011_servicios_app.sql).
// `fotoUrl` queda null a propósito en los 4 "disponible": en modo mock, la pantalla de
// Servicios usa las fotos genéricas ya empaquetadas en assets/servicios/ (ver
// IMAGENES_LOCALES en app/(tabs)/servicios/index.tsx) en vez de depender de una URL de
// servidor que no existe en este modo — no es "inventar una foto de un negocio real", son
// fotos decorativas de categoría, iguales para cualquiera que corra la app sin servidor.
const serviciosSemilla: Omit<ServicioApp, "negocios" | "visitas7d">[] = [
  { slug: "negocios", nombre: "Guía de negocios", descripcion: "", estado: "disponible", fotoUrl: null, orden: 1 },
  { slug: "restaurantes", nombre: "Restaurantes", descripcion: "Platos y pedidos", estado: "disponible", fotoUrl: null, orden: 2 },
  { slug: "market-space", nombre: "Market Space", descripcion: "Productos de emprendedores", estado: "disponible", fotoUrl: null, orden: 3 },
  { slug: "supermarket", nombre: "Supermarket", descripcion: "Todo para tu despensa", estado: "disponible", fotoUrl: null, orden: 4 },
  { slug: "rescate-animal", nombre: "Rescate animal", descripcion: "", estado: "proximamente", fotoUrl: null, orden: 5 },
  { slug: "turismo", nombre: "Turismo", descripcion: "", estado: "proximamente", fotoUrl: null, orden: 6 },
  { slug: "inmobiliaria", nombre: "Inmobiliaria", descripcion: "", estado: "proximamente", fotoUrl: null, orden: 7 },
  { slug: "taxi", nombre: "Taxi", descripcion: "", estado: "proximamente", fotoUrl: null, orden: 8 },
  { slug: "consultorias", nombre: "Consultorías", descripcion: "", estado: "proximamente", fotoUrl: null, orden: 9 },
  { slug: "bolsa-empleo", nombre: "Bolsa de empleo", descripcion: "", estado: "proximamente", fotoUrl: null, orden: 10 },
  { slug: "bolsa-puntos", nombre: "Bolsa de puntos", descripcion: "", estado: "proximamente", fotoUrl: null, orden: 11 },
  { slug: "otros", nombre: "Otros servicios", descripcion: "", estado: "proximamente", fotoUrl: null, orden: 12 },
];

export const serviciosMock: ServicioApp[] = serviciosSemilla.map((s) => ({
  ...s,
  negocios: contarNegocios(s.slug),
  visitas7d: VISITAS_7D_MOCK[s.slug] ?? 0,
}));
