import { StyleSheet, View } from "react-native";
import { espaciado, useColores } from "../disenio";
import { Hueso } from "./EsqueletoNegocio";

/** Carga de un aviso de Comunidad con la misma forma que TarjetaAviso: etiqueta, título, texto y autor. */
export function EsqueletoAviso() {
  const colores = useColores();
  return (
    <View
      style={{
        paddingVertical: espaciado.lg,
        gap: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colores.borde,
      }}
    >
      <Hueso style={{ width: 88, height: 16, borderRadius: 4 }} />
      <Hueso style={{ width: "75%", height: 14, borderRadius: 6 }} />
      <Hueso style={{ width: "95%", height: 10, borderRadius: 5 }} />
      <Hueso style={{ width: "60%", height: 10, borderRadius: 5 }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
        <Hueso style={{ width: 24, height: 24, borderRadius: 12 }} />
        <Hueso style={{ width: 140, height: 9, borderRadius: 5 }} />
      </View>
    </View>
  );
}

export function EsqueletoListaAvisos({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <View accessibilityLabel="Cargando avisos" accessibilityRole="progressbar">
      {Array.from({ length: cantidad }).map((_, i) => (
        <EsqueletoAviso key={i} />
      ))}
    </View>
  );
}
