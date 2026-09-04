import { Arquetipo } from "@app-vecinos/tipos";

export const arquetiposMock: Arquetipo[] = [
  {
    id: "arq-menu",
    nombre: "Menú",
    icono: "restaurant-outline",
    plantillaId: "lista-agrupada",
    origen: "sistema",
    campos: [
      { claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true },
      { claveOriginal: "Precio", etiqueta: "Precio", obligatorio: true },
      { claveOriginal: "Sección", etiqueta: "Sección", obligatorio: true },
      { claveOriginal: "Destacado", etiqueta: "Destacado", obligatorio: false },
    ],
  },
  {
    id: "arq-catalogo",
    nombre: "Catálogo",
    icono: "shirt-outline",
    plantillaId: "grilla-foto",
    origen: "sistema",
    campos: [
      { claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true },
      { claveOriginal: "Precio", etiqueta: "Precio", obligatorio: true },
      { claveOriginal: "Sección", etiqueta: "Sección", obligatorio: false },
      { claveOriginal: "Foto", etiqueta: "Foto", obligatorio: false },
      { claveOriginal: "Destacado", etiqueta: "Destacado", obligatorio: false },
    ],
  },
  {
    id: "arq-servicios",
    nombre: "Servicios",
    icono: "briefcase-outline",
    plantillaId: "lista-simple",
    origen: "sistema",
    campos: [
      { claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true },
      { claveOriginal: "Detalle", etiqueta: "Detalle", obligatorio: false },
      { claveOriginal: "Precio", etiqueta: "Precio", obligatorio: true },
    ],
  },
  {
    id: "arq-rubros",
    nombre: "Rubros",
    icono: "apps-outline",
    plantillaId: "chips",
    origen: "sistema",
    campos: [{ claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true }],
  },
  {
    id: "arq-ofertas",
    nombre: "Ofertas",
    icono: "cart-outline",
    plantillaId: "carrusel-descuento",
    origen: "sistema",
    campos: [
      { claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true },
      { claveOriginal: "Precio", etiqueta: "Precio", obligatorio: true },
      { claveOriginal: "Precio anterior", etiqueta: "Precio anterior", obligatorio: false },
      { claveOriginal: "Etiqueta", etiqueta: "Etiqueta", obligatorio: false },
    ],
  },
  {
    id: "arq-consultorias",
    nombre: "Consultorías",
    icono: "medical-outline",
    plantillaId: "ficha-perfil",
    origen: "personalizado",
    campos: [
      { claveOriginal: "Foto", etiqueta: "Foto", obligatorio: false },
      { claveOriginal: "Especialidad", etiqueta: "Especialidad", obligatorio: true },
      { claveOriginal: "Tarifa", etiqueta: "Tarifa", obligatorio: true },
      { claveOriginal: "Disponible ahora", etiqueta: "Disponible ahora", obligatorio: false },
    ],
  },
];
