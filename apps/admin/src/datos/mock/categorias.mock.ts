import { Categoria } from "@app-vecinos/tipos";

export const categoriasMock: Categoria[] = [
  { id: "cat-comida", padreId: null, nombre: "Comida", slug: "comida", icono: "restaurant-outline", orden: 1, fotoUrl: null, arquetipoFicha: "menu", arquetipoId: "arq-menu" },
  { id: "cat-salud", padreId: null, nombre: "Salud", slug: "salud", icono: "medkit-outline", orden: 2, fotoUrl: null, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
  { id: "cat-hogar", padreId: null, nombre: "Hogar", slug: "hogar", icono: "construct-outline", orden: 3, fotoUrl: null, arquetipoFicha: "categorias", arquetipoId: "arq-rubros" },
  { id: "cat-moda", padreId: null, nombre: "Moda", slug: "moda", icono: "shirt-outline", orden: 4, fotoUrl: null, arquetipoFicha: "catalogo", arquetipoId: "arq-catalogo" },
  { id: "cat-servicios", padreId: null, nombre: "Servicios", slug: "servicios", icono: "briefcase-outline", orden: 5, fotoUrl: null, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
  { id: "cat-mascotas", padreId: null, nombre: "Mascotas", slug: "mascotas", icono: "paw-outline", orden: 6, fotoUrl: null, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
  { id: "cat-restaurantes", padreId: null, nombre: "Restaurantes", slug: "restaurantes", icono: "restaurant-outline", orden: 7, fotoUrl: null, arquetipoFicha: "menu", arquetipoId: "arq-menu" },
  { id: "cat-supermercado", padreId: null, nombre: "Supermercados", slug: "supermercados", icono: "cart-outline", orden: 8, fotoUrl: null, arquetipoFicha: "ofertas", arquetipoId: "arq-ofertas" },
  { id: "cat-emprendimientos", padreId: null, nombre: "Emprendimientos", slug: "emprendimientos", icono: "storefront-outline", orden: 9, fotoUrl: null },
  { id: "cat-rescate-animal", padreId: null, nombre: "Rescate animal", slug: "rescate-animal", icono: "paw-outline", orden: 10, fotoUrl: null, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
  { id: "cat-turismo", padreId: null, nombre: "Turismo", slug: "turismo", icono: "airplane-outline", orden: 11, fotoUrl: null, arquetipoFicha: "catalogo", arquetipoId: "arq-catalogo" },
  { id: "cat-inmobiliaria", padreId: null, nombre: "Inmobiliaria", slug: "inmobiliaria", icono: "business-outline", orden: 12, fotoUrl: null, arquetipoFicha: "catalogo", arquetipoId: "arq-catalogo" },
  { id: "cat-consultorias", padreId: null, nombre: "Consultorías", slug: "consultorias", icono: "medical-outline", orden: 13, fotoUrl: null, arquetipoId: "arq-consultorias" },
  { id: "cat-otros-servicios", padreId: null, nombre: "Otros servicios", slug: "otros-servicios", icono: "apps-outline", orden: 14, fotoUrl: null, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
];
