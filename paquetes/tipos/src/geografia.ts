export interface Coordenada {
  lat: number;
  lng: number;
}

export interface Departamento {
  ubigeo: string;
  nombre: string;
  activo: boolean;
}

export interface Provincia {
  ubigeo: string;
  departamentoUbigeo: string;
  nombre: string;
  activo: boolean;
}

export interface Distrito {
  ubigeo: string;
  provinciaUbigeo: string;
  nombre: string;
  centro: Coordenada;
  activo: boolean;
}

export interface Comunidad {
  id: string;
  distritoUbigeo: string;
  nombre: string;
  slug: string;
  /** Punto de referencia para calcular distancias mientras no se tenga la ubicación real del vecino (ver utilidades/distancia.ts). */
  centro: Coordenada;
  /** Texto libre para la pantalla "Sobre tu comunidad" en Mi perfil. null si todavía no se cargó ningún contenido. */
  descripcion: string | null;
  activo: boolean;
  fechaLanzamiento: string | null;
}
