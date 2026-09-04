import NetInfo from "@react-native-community/netinfo";
import { onlineManager, QueryClient } from "@tanstack/react-query";
import { entorno } from "../config/entorno";

// TanStack Query, por defecto, detecta conectividad con eventos del navegador
// (window.addEventListener("online"/"offline")) — en React Native esos eventos no existen,
// así que sin este puente `onlineManager` cree que SIEMPRE hay conexión, sin importar lo que
// diga el dispositivo real. Se conecta acá con el mismo NetInfo que ya usa
// `useConectividad`/`BannerSinConexion` — antes eran dos sistemas de detección de red
// completamente separados que no se enteraban el uno del otro.
onlineManager.setEventListener((estaOnline) => {
  return NetInfo.addEventListener((estado) => {
    estaOnline(estado.isConnected === true && estado.isInternetReachable !== false);
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      // Depende de si los repositorios activos son reales o mock — no es lo mismo para los
      // dos, y unificarlo en uno solo rompía uno de los dos casos:
      // - "api": los repositorios sí dependen de HTTP real. "online" (el default de la
      //   librería) pausa una query mientras el dispositivo está sin conexión en vez de
      //   lanzar un fetch condenado a fallar, y la reintenta sola apenas vuelve la señal —
      //   con onlineManager ya conectado a NetInfo arriba, esto ahora funciona de verdad.
      // - "mock": los datos son locales y síncronos, nunca dependen de la red — con "online"
      //   se pausarían igual que las reales apenas el dispositivo se reporta sin conexión,
      //   rompiendo lo que en mock siempre debió funcionar sin importar la conectividad. Se
      //   mantiene "always" para ese caso, tal como pedía el comentario original de esta
      //   decisión (ver docs/decisiones/0013-movil-conectado-a-api.md).
      networkMode: entorno.fuenteDeDatos === "api" ? "online" : "always",
    },
  },
});
