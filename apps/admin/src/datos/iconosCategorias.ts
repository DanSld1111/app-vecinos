export interface IconoOpcion {
  nombre: string;
  etiqueta: string;
  palabras: string[];
}

export interface GrupoIcono {
  id: string;
  nombre: string;
  iconos: IconoOpcion[];
}

export const GRUPOS_ICONO: GrupoIcono[] = [
  {
    id: "comida",
    nombre: "Comida",
    iconos: [
      { nombre: "restaurant-outline", etiqueta: "Restaurante", palabras: ["menu", "comida", "plato", "restaurante"] },
      { nombre: "fast-food-outline", etiqueta: "Comida rápida", palabras: ["hamburguesa", "rapida"] },
      { nombre: "pizza-outline", etiqueta: "Pizza", palabras: ["pizza"] },
      { nombre: "ice-cream-outline", etiqueta: "Helados", palabras: ["helado", "postre"] },
      { nombre: "cafe-outline", etiqueta: "Café", palabras: ["cafe", "cafeteria"] },
      { nombre: "wine-outline", etiqueta: "Bebidas", palabras: ["bebida", "bar", "licor"] },
      { nombre: "nutrition-outline", etiqueta: "Saludable", palabras: ["fruta", "saludable", "ensalada"] },
    ],
  },
  {
    id: "salud",
    nombre: "Salud",
    iconos: [
      { nombre: "medkit-outline", etiqueta: "Médico", palabras: ["medico", "consulta", "salud"] },
      { nombre: "medical-outline", etiqueta: "Farmacia", palabras: ["pastilla", "farmacia", "medicina"] },
      { nombre: "fitness-outline", etiqueta: "Fitness", palabras: ["gimnasio", "ejercicio"] },
      { nombre: "pulse-outline", etiqueta: "Salud", palabras: ["pulso", "salud", "corazon"] },
      { nombre: "bandage-outline", etiqueta: "Curación", palabras: ["curita", "herida"] },
      { nombre: "eye-outline", etiqueta: "Óptica", palabras: ["oftalmologo", "ojo", "optica"] },
    ],
  },
  {
    id: "hogar",
    nombre: "Hogar",
    iconos: [
      { nombre: "home-outline", etiqueta: "Casa", palabras: ["casa", "hogar"] },
      { nombre: "construct-outline", etiqueta: "Reparación", palabras: ["llave", "reparacion", "gasfiteria", "herramienta"] },
      { nombre: "hammer-outline", etiqueta: "Herramientas", palabras: ["martillo", "ferreteria", "construccion"] },
      { nombre: "water-outline", etiqueta: "Gasfitería", palabras: ["agua", "ducha", "gasfiteria"] },
      { nombre: "flash-outline", etiqueta: "Electricidad", palabras: ["electricidad", "enchufe", "luz"] },
      { nombre: "leaf-outline", etiqueta: "Jardinería", palabras: ["planta", "jardineria"] },
      { nombre: "brush-outline", etiqueta: "Pintura", palabras: ["pintura", "brocha"] },
    ],
  },
  {
    id: "moda",
    nombre: "Moda",
    iconos: [
      { nombre: "shirt-outline", etiqueta: "Ropa", palabras: ["polo", "camisa", "ropa", "vestido", "moda"] },
      { nombre: "bag-handle-outline", etiqueta: "Cartera", palabras: ["cartera", "bolso"] },
      { nombre: "diamond-outline", etiqueta: "Joyería", palabras: ["anillo", "joyeria", "accesorio"] },
      { nombre: "glasses-outline", etiqueta: "Lentes", palabras: ["lentes", "sol"] },
      { nombre: "cut-outline", etiqueta: "Peluquería", palabras: ["corte", "peluqueria", "belleza", "tijera"] },
    ],
  },
  {
    id: "mascotas",
    nombre: "Mascotas",
    iconos: [
      { nombre: "paw-outline", etiqueta: "Mascotas", palabras: ["mascota", "huella", "veterinaria", "perro", "gato"] },
      { nombre: "fish-outline", etiqueta: "Peces", palabras: ["pez", "acuario"] },
    ],
  },
  {
    id: "servicios",
    nombre: "Servicios y negocio",
    iconos: [
      { nombre: "briefcase-outline", etiqueta: "Consultoría", palabras: ["consultoria", "oficina", "trabajo", "profesional"] },
      { nombre: "business-outline", etiqueta: "Inmobiliaria", palabras: ["inmobiliaria", "edificio", "oficina"] },
      { nombre: "cart-outline", etiqueta: "Supermercado", palabras: ["tienda", "supermercado", "compras", "carrito"] },
      { nombre: "storefront-outline", etiqueta: "Emprendimiento", palabras: ["tienda", "emprendimiento", "negocio"] },
      { nombre: "receipt-outline", etiqueta: "Trámites", palabras: ["recibo", "tramite", "contabilidad"] },
      { nombre: "calculator-outline", etiqueta: "Contabilidad", palabras: ["contador", "calculo"] },
      { nombre: "print-outline", etiqueta: "Imprenta", palabras: ["imprenta", "copias"] },
      { nombre: "key-outline", etiqueta: "Cerrajería", palabras: ["cerrajeria", "llave"] },
      { nombre: "car-outline", etiqueta: "Taller", palabras: ["taller", "auto", "mecanico"] },
      { nombre: "school-outline", etiqueta: "Educación", palabras: ["academia", "clases", "educacion"] },
    ],
  },
  {
    id: "movilidad",
    nombre: "Movilidad y viajes",
    iconos: [
      { nombre: "airplane-outline", etiqueta: "Turismo", palabras: ["turismo", "viaje", "avion"] },
      { nombre: "bicycle-outline", etiqueta: "Bicicletas", palabras: ["bicicleta", "alquiler"] },
      { nombre: "bus-outline", etiqueta: "Transporte", palabras: ["bus", "transporte"] },
    ],
  },
  {
    id: "otros",
    nombre: "Otros",
    iconos: [
      { nombre: "apps-outline", etiqueta: "Varios", palabras: ["otros", "varios", "generico"] },
      { nombre: "extension-puzzle-outline", etiqueta: "Otros servicios", palabras: ["otros", "rompecabezas", "generico"] },
      { nombre: "color-palette-outline", etiqueta: "Arte", palabras: ["arte", "manualidades"] },
      { nombre: "musical-notes-outline", etiqueta: "Música", palabras: ["musica", "academia"] },
      { nombre: "library-outline", etiqueta: "Librería", palabras: ["libros", "libreria", "educacion"] },
      { nombre: "pricetag-outline", etiqueta: "Etiqueta", palabras: ["etiqueta", "generico", "precio"] },
      { nombre: "star-outline", etiqueta: "Destacado", palabras: ["estrella", "destacado"] },
    ],
  },
];

export function buscarIconos(consulta: string): IconoOpcion[] {
  const q = consulta.trim().toLowerCase();
  if (!q) return [];
  return GRUPOS_ICONO.flatMap((grupo) => grupo.iconos).filter(
    (op) => op.etiqueta.toLowerCase().includes(q) || op.palabras.some((palabra) => palabra.includes(q))
  );
}
