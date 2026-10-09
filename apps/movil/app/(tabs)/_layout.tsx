import { useEffect } from "react";
import { Tabs } from "expo-router";
import { BarraPestanas } from "../../src/componentes/BarraPestanas";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useComunidadesActivas } from "../../src/datos/hooks/useComunidades";

export default function LayoutTabs() {
  const { comunidad, establecerComunidad } = useComunidadActiva();
  const { data: comunidades } = useComunidadesActivas();

  useEffect(() => {
    if (!comunidad && comunidades && comunidades.length > 0) {
      establecerComunidad(comunidades[0]);
    }
  }, [comunidad, comunidades, establecerComunidad]);

  return (
    // "fade": cambio de pestaña con un fundido corto en vez de un corte seco.
    <Tabs tabBar={(props) => <BarraPestanas {...props} />} screenOptions={{ headerShown: false, animation: "fade" }}>
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="servicios" options={{ title: "Servicios" }} />
      <Tabs.Screen name="para-ti" options={{ title: "Para ti" }} />
      <Tabs.Screen name="comunidad" options={{ title: "Comunidad" }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
