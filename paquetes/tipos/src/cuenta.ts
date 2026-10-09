export type RolCuenta =
  | "super_admin"
  | "dueno_negocio"
  | "junta_vecinal"
  | "validador_contenido"
  | "gestor_negocios"
  /** Publica y administra todo el módulo "Para ti" (decisión 0091). Solo ve ese módulo en el panel. */
  | "editor_redes";

export interface Cuenta {
  id: string;
  nombre: string;
  correo: string;
  rol: RolCuenta;
  /** Solo si rol = "dueno_negocio". Una misma persona puede administrar varios negocios (varios locales). */
  negocioIds: string[];
  /** Solo si rol = "junta_vecinal" o "validador_contenido". Vacío = todos los distritos. */
  distritosAsignados: string[];
  activo: boolean;
  creadoEn: string;
  ultimoAccesoEn: string | null;
  fotoUrl: string | null;
}
