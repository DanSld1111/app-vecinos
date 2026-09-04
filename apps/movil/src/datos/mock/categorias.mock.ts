import { Categoria } from "@app-vecinos/tipos";

export const categoriasMock: Categoria[] = [
  { id: "cat-comida", padreId: null, nombre: "Comida", slug: "comida", icono: "nutrition-outline", fotoUrl: "https://images.unsplash.com/photo-1549413468-cd78edb7e75c?auto=format&fit=crop&w=400&q=80", orden: 1, arquetipoFicha: "menu" },
  { id: "cat-salud", padreId: null, nombre: "Salud", slug: "salud", icono: "medkit-outline", fotoUrl: "https://images.unsplash.com/photo-1612276529731-4b21494e6d71?auto=format&fit=crop&w=400&q=80", orden: 2, arquetipoFicha: "servicios" },
  { id: "cat-hogar", padreId: null, nombre: "Hogar", slug: "hogar", icono: "construct-outline", fotoUrl: "https://images.unsplash.com/photo-1613206485381-b028e578e791?auto=format&fit=crop&w=400&q=80", orden: 3, arquetipoFicha: "categorias" },
  { id: "cat-moda", padreId: null, nombre: "Moda", slug: "moda", icono: "shirt-outline", fotoUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=400&q=80", orden: 4, arquetipoFicha: "catalogo" },
  { id: "cat-servicios", padreId: null, nombre: "Servicios", slug: "servicios", icono: "briefcase-outline", fotoUrl: "https://images.unsplash.com/photo-1614792403436-ba5b3e747604?auto=format&fit=crop&w=400&q=80", orden: 5, arquetipoFicha: "servicios" },
  { id: "cat-mascotas", padreId: null, nombre: "Mascotas", slug: "mascotas", icono: "paw-outline", fotoUrl: "https://images.unsplash.com/photo-1621371236495-1520d8dc72a5?auto=format&fit=crop&w=400&q=80", orden: 6, arquetipoFicha: "servicios" },
  { id: "cat-restaurantes", padreId: null, nombre: "Restaurantes", slug: "restaurantes", icono: "restaurant-outline", fotoUrl: "https://images.unsplash.com/photo-1558030137-a56c1b004fa3?auto=format&fit=crop&w=400&q=80", orden: 7, arquetipoFicha: "menu" },
  { id: "cat-supermercado", padreId: null, nombre: "Supermercados", slug: "supermercados", icono: "cart-outline", fotoUrl: "https://images.unsplash.com/photo-1489450278009-822e9be04dff?auto=format&fit=crop&w=400&q=80", orden: 8, arquetipoFicha: "ofertas" },
  { id: "cat-emprendimientos", padreId: null, nombre: "Emprendimientos", slug: "emprendimientos", icono: "storefront-outline", fotoUrl: "https://images.unsplash.com/photo-1519412849983-957822373d02?auto=format&fit=crop&w=400&q=80", orden: 9 },
  // Estas 5 nacen del roadmap "Próximamente" de la pestaña Servicios: encajan como negocio con ficha
  // (tienen categoría + arquetipo), a diferencia de Taxi / Bolsa de empleo / Bolsa de puntos, que son
  // funcionalidades transaccionales propias y se quedan en esa lista hasta que se construyan aparte.
  { id: "cat-rescate-animal", padreId: null, nombre: "Rescate animal", slug: "rescate-animal", icono: "heart-outline", fotoUrl: "https://images.unsplash.com/photo-1558618047-f4b511aae74d?auto=format&fit=crop&w=400&q=80", orden: 10, arquetipoFicha: "servicios" },
  { id: "cat-turismo", padreId: null, nombre: "Turismo", slug: "turismo", icono: "airplane-outline", fotoUrl: "https://images.unsplash.com/photo-1563705343138-780c54f8b7ec?auto=format&fit=crop&w=400&q=80", orden: 11, arquetipoFicha: "catalogo" },
  { id: "cat-inmobiliaria", padreId: null, nombre: "Inmobiliaria", slug: "inmobiliaria", icono: "business-outline", fotoUrl: "https://images.unsplash.com/photo-1579632652768-6cb9dcf85912?auto=format&fit=crop&w=400&q=80", orden: 12, arquetipoFicha: "catalogo" },
  { id: "cat-consultorias", padreId: null, nombre: "Consultorías", slug: "consultorias", icono: "bulb-outline", fotoUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80", orden: 13, arquetipoFicha: "servicios" },
  { id: "cat-otros-servicios", padreId: null, nombre: "Otros servicios", slug: "otros-servicios", icono: "apps-outline", fotoUrl: "https://images.unsplash.com/photo-1542323228-002ac256e7b8?auto=format&fit=crop&w=400&q=80", orden: 14, arquetipoFicha: "servicios" },
];
