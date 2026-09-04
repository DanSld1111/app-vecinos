import { StyleSheet, Text, View, ViewStyle } from "react-native";

// Tonos cálidos/fríos deliberadamente distintos de la marca (verde/coral) — para que un avatar
// nunca se confunda con un estado (abierto, verificado, etc.), solo es identidad visual.
const COLORES_AVATAR = ["#d9a15c", "#8fae9c", "#d98a5c", "#7fae7f", "#7c94a8", "#c98fb0"];

function iniciales(nombre: string): string {
  const palabras = nombre.split(" ").filter(Boolean);
  return ((palabras[0]?.[0] ?? "") + (palabras[1]?.[0] ?? "")).toUpperCase();
}

/** Hash simple del nombre → siempre el mismo color para el mismo negocio, en cualquier pantalla donde aparezca (antes dependía de la posición en la lista, así que un mismo negocio podía verse con colores distintos en Inicio, el buscador, etc.). */
function colorParaNombre(nombre: string): string {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = (hash * 31 + nombre.charCodeAt(i)) % 1_000_003;
  return COLORES_AVATAR[Math.abs(hash) % COLORES_AVATAR.length];
}

/**
 * Reemplazo único para "este negocio no tiene foto todavía" en tarjetas y filas pequeñas —
 * iniciales sobre un color estable por nombre, en vez de un cuadro vacío. Ver
 * docs/decisiones/0022-diseno-post-revision.md. Para espacios grandes (la foto principal de la
 * ficha, la tarjeta destacada) se usa `SinFoto` en su lugar — un ícono, no una letra gigante.
 */
export function AvatarNegocio({
  nombre,
  size = 44,
  radio,
  style,
}: {
  nombre: string;
  size?: number;
  /** Por defecto, circular (size / 2). Pasar un valor para esquinas menos redondeadas (tarjetas cuadradas). */
  radio?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radio ?? size / 2,
          backgroundColor: colorParaNombre(nombre),
        },
        style,
      ]}
    >
      <Text style={[styles.texto, { fontSize: size * 0.36 }]}>{iniciales(nombre)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  texto: {
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#ffffff",
  },
});
