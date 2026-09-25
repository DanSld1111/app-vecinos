import { create } from "zustand";
import * as Location from "expo-location";
import { Coordenada } from "@app-vecinos/tipos";

/** Cuánto se confía en la última ubicación antes de volver a pedirla — así Inicio no dispara el
 * GPS en cada apertura, solo cuando ya pasó un rato. Ver docs/decisiones/0073-inicio-orden-real.md. */
const VIGENCIA_MS = 5 * 60 * 1000;

export type EstadoPermisoUbicacion = "sin_pedir" | "concedido" | "denegado";

interface EstadoUbicacionUsuario {
  coordenada: Coordenada | null;
  obtenidaEn: number | null;
  permiso: EstadoPermisoUbicacion;
  cargando: boolean;
  /** No relanza el GPS si ya hay una ubicación vigente (VIGENCIA_MS) — pásale `forzar: true` para
   * saltarse esa caché (ej. un botón "actualizar ubicación" a futuro). */
  asegurarUbicacion: (opciones?: { forzar?: boolean }) => Promise<void>;
}

export const useUbicacionUsuario = create<EstadoUbicacionUsuario>((set, get) => ({
  coordenada: null,
  obtenidaEn: null,
  permiso: "sin_pedir",
  cargando: false,

  asegurarUbicacion: async ({ forzar = false } = {}) => {
    const estado = get();
    if (estado.cargando) return;
    if (!forzar && estado.coordenada && estado.obtenidaEn && Date.now() - estado.obtenidaEn < VIGENCIA_MS) {
      return;
    }

    // El navegador (previsualización web) no tiene el mismo flujo de permisos nativo de Expo —
    // igual funciona (usa la API de geolocalización del navegador por debajo), pero puede
    // rechazar distinto; se trata igual como "denegado" si falla.
    set({ cargando: true });
    try {
      const permisoActual = await Location.getForegroundPermissionsAsync();
      const status =
        permisoActual.status === "granted"
          ? permisoActual.status
          : (await Location.requestForegroundPermissionsAsync()).status;

      if (status !== "granted") {
        set({ permiso: "denegado", cargando: false });
        return;
      }

      const posicion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      set({
        coordenada: { lat: posicion.coords.latitude, lng: posicion.coords.longitude },
        obtenidaEn: Date.now(),
        permiso: "concedido",
        cargando: false,
      });
    } catch {
      // Sin permiso del sistema, GPS apagado, o el navegador lo rechazó — se sigue mostrando
      // Inicio igual, solo que ordenado por popularidad en vez de por distancia real.
      set({ permiso: "denegado", cargando: false });
    }
  },
}));
