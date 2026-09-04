import { create } from "zustand";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { IDS_CATEGORIAS_NOTIFICACION } from "../config/categoriasNotificacion";
import { useSesion } from "./useSesion";
import { entorno } from "../config/entorno";

// Para que una notificación recibida con la app abierta en primer plano también se muestre
// (por defecto expo-notifications la descarta en foreground). Se registra una sola vez al
// importar este módulo.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function preferenciasIniciales(): Record<string, boolean> {
  return Object.fromEntries(IDS_CATEGORIAS_NOTIFICACION.map((c) => [c.id, c.porDefecto]));
}

/**
 * Envía (o borra, con null) el token de push al backend — solo tiene sentido para una cuenta
 * real (no "continuar como invitado", que no tiene token de sesión). Silencioso ante fallos:
 * el vecino ya decidió su preferencia localmente, un error de red acá no debe bloquear nada.
 * Ver docs/decisiones/0021-endurecimiento-post-diagnostico.md.
 */
async function enviarTokenAlServidor(pushToken: string | null): Promise<void> {
  const token = useSesion.getState().token;
  if (!token) return;
  try {
    await fetch(`${entorno.apiUrl}/auth/vecino/push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pushToken }),
    });
  } catch {
    // Sin conexión o servidor caído — se reintentará la próxima vez que se abra este modal
    // o se cambie la preferencia; no hay nada más que hacer acá.
  }
}

interface EstadoNotificaciones {
  permisoDecidido: boolean;
  activas: boolean;
  decidir: (activar: boolean) => Promise<void>;
  /** Preferencia por categoría (ver src/config/categoriasNotificacion.ts). Todas parten en su valor "porDefecto". */
  preferencias: Record<string, boolean>;
  alternarCategoria: (id: string) => void;
}

export const useNotificaciones = create<EstadoNotificaciones>((set) => ({
  permisoDecidido: false,
  activas: false,
  preferencias: preferenciasIniciales(),

  decidir: async (activar) => {
    if (!activar) {
      set({ permisoDecidido: true, activas: false });
      void enviarTokenAlServidor(null);
      return;
    }

    // El navegador (modo web, usado hoy para previsualizar la app) no tiene el mismo flujo de
    // permisos/push nativo de Expo — se guarda la preferencia igual, pero sin pedir permiso del
    // sistema operativo ni token real, que solo existe en un build nativo (Android/iOS).
    if (Platform.OS === "web") {
      set({ permisoDecidido: true, activas: true });
      return;
    }

    try {
      const permisoActual = await Notifications.getPermissionsAsync();
      const status =
        permisoActual.status === "granted"
          ? permisoActual.status
          : (await Notifications.requestPermissionsAsync()).status;

      if (status !== "granted") {
        set({ permisoDecidido: true, activas: false });
        return;
      }
      set({ permisoDecidido: true, activas: true });

      // El id de proyecto EAS hace falta para pedir el token real — sin él (todavía no se
      // publicó un build con `eas build`) esta llamada falla y se captura abajo: el vecino
      // queda con el permiso activado, solo falta que exista ese build para registrar su token.
      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
      const { data: pushToken } = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      void enviarTokenAlServidor(pushToken);
    } catch {
      set({ permisoDecidido: true, activas: true });
    }
  },

  alternarCategoria: (id) =>
    set((estado) => ({
      preferencias: { ...estado.preferencias, [id]: !estado.preferencias[id] },
    })),
}));
