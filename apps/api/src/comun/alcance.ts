import { Cuenta } from "@app-vecinos/tipos";

/** Espejo server-side de apps/admin/src/utilidades/alcance.ts: sin distritos asignados = todos los distritos. */
export function dentroDelAlcance(cuenta: Cuenta, distritoUbigeo: string): boolean {
  return cuenta.distritosAsignados.length === 0 || cuenta.distritosAsignados.includes(distritoUbigeo);
}
