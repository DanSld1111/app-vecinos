import { Anuncio } from "@app-vecinos/tipos";

// Edita esta lista para cambiar qué anuncios rotan en Inicio y en el banner de Buscar.
// El intervalo de rotación del carrusel se controla en CarruselPublicidad.tsx (INTERVALO_MS).
// En modo API esto viene del servidor (panel admin > Publicidad) — ver
// docs/decisiones/0028-fotos-productos-galeria-y-publicidad.md.
export const anunciosMock: Anuncio[] = [
  {
    id: "ad-fogon",
    nombre: "20% en parrillas — El Fogón",
    detalle: "20% en parrillas todos los martes",
    imagenUrl: "https://images.unsplash.com/photo-1558030137-a56c1b004fa3?auto=format&fit=crop&w=200&q=80",
    ubicaciones: ["carrusel_inicio"],
    negocioId: "neg-restaurante-fogon",
    fechaInicio: "2026-08-01",
    fechaFin: null,
    orden: 1,
    activo: true,
  },
  {
    id: "ad-supermercado",
    nombre: "2x1 en lácteos — Supermercado SB",
    detalle: "2x1 en lácteos esta semana",
    imagenUrl: "https://images.unsplash.com/photo-1489450278009-822e9be04dff?auto=format&fit=crop&w=200&q=80",
    ubicaciones: ["carrusel_inicio", "banner_buscar"],
    negocioId: "neg-supermercado-sb",
    fechaInicio: "2026-08-01",
    fechaFin: null,
    orden: 2,
    activo: true,
  },
  {
    id: "ad-herminia",
    nombre: "Torta por encargo — Doña Herminia",
    detalle: "Encarga tu torta con 48h de anticipo",
    imagenUrl: "https://images.unsplash.com/photo-1607877107150-de8a24f3900b?auto=format&fit=crop&w=200&q=80",
    ubicaciones: ["banner_buscar"],
    negocioId: "neg-postres-herminia",
    fechaInicio: "2026-08-01",
    fechaFin: null,
    orden: 3,
    activo: true,
  },
];
