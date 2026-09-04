import { Coordenada } from "./geografia";

export type TipoProfesional = "medico" | "veterinario" | "legal_contable";

export interface Profesional {
  id: string;
  comunidadId: string;
  tipo: TipoProfesional;
  nombre: string;
  colegiaturaNumero: string;
  colegiaturaEntidad: string;
  colegiaturaVerificadaEn: string | null;
  especialidad: string;
  whatsapp: string;
  direccionConsultorio: string;
  coordenada: Coordenada;
  activo: boolean;
}
