/**
 * Un Arquetipo elige una PlantillaVisual (paquetes/tipos/src/plantilla.ts) y le pone nombres propios
 * a sus campos — no diseña nada nuevo, solo personaliza etiquetas sobre un diseño ya resuelto.
 */
export interface CampoArquetipo {
  /** Etiqueta original tal como la define la plantilla — sirve para relacionar, no se muestra. */
  claveOriginal: string;
  /** Nombre que ve el dueño del negocio al cargar este campo. */
  etiqueta: string;
  obligatorio: boolean;
}

export interface Arquetipo {
  id: string;
  nombre: string;
  /** Nombre de ícono de Ionicons (mismo registro que usa Categorías). */
  icono: string;
  /** Referencia a `PlantillaVisual.id`. No se puede cambiar después de creado. */
  plantillaId: string;
  /** "sistema" = uno de los 5 arquetipos originales, migrado tal cual. */
  origen: "sistema" | "personalizado";
  campos: CampoArquetipo[];
}
