import { Comunidad, Cuenta } from "@app-vecinos/tipos";

/**
 * Resuelve el distrito de una comunidad a partir de la lista de comunidades VIGENTE.
 * Pásale siempre `comunidades` desde `useGeografia` (reactivo) — nunca un array fijo — para que
 * distritos agregados en tiempo de ejecución (vía Distritos.tsx) también se resuelvan bien.
 */
export function distritoDeComunidad(comunidades: Comunidad[], comunidadId: string): string {
  return comunidades.find((c) => c.id === comunidadId)?.distritoUbigeo ?? "";
}

/** Vacío en distritosAsignados = alcance total (típico del super-admin). */
export function dentroDelAlcance(cuenta: Cuenta, distritoUbigeo: string): boolean {
  return cuenta.distritosAsignados.length === 0 || cuenta.distritosAsignados.includes(distritoUbigeo);
}
