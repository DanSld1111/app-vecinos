import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Publicacion } from "@app-vecinos/tipos";
import { PaletaColores, tipografia, useColores } from "../../disenio";
import { enlacePublicacion } from "../../datos/hooks/useParaTi";
import { HojaInferior } from "../HojaInferior";

type Opcion = { icono: keyof typeof Ionicons.glyphMap; texto: string; accion: () => void };

/** El menú "…" de una publicación: abrirla, comentarios, compartir y copiar el enlace. */
export function MenuPublicacion({
  p,
  onCerrar,
  onAbrir,
  onComentarios,
  onCompartir,
  onAviso,
}: {
  p: Publicacion | null;
  onCerrar: () => void;
  onAbrir: (p: Publicacion) => void;
  onComentarios: (p: Publicacion) => void;
  onCompartir: (p: Publicacion) => void;
  onAviso: (texto: string) => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  if (!p) return null;

  async function copiar(pub: Publicacion) {
    try {
      const nav = globalThis.navigator as Navigator | undefined;
      if (Platform.OS === "web" && nav?.clipboard) {
        await nav.clipboard.writeText(enlacePublicacion(pub.id));
        onAviso("Enlace copiado");
      } else onCompartir(pub);
    } catch {
      onAviso("No se pudo copiar el enlace.");
    }
  }

  const opciones: Opcion[] = [
    { icono: "expand-outline", texto: "Ver publicación completa", accion: () => onAbrir(p) },
    ...(p.permiteComentarios ? [{ icono: "chatbubble-outline" as const, texto: "Ver comentarios", accion: () => onComentarios(p) }] : []),
    { icono: "paper-plane-outline", texto: "Compartir", accion: () => onCompartir(p) },
    { icono: "link-outline", texto: "Copiar enlace", accion: () => copiar(p) },
  ];

  return (
    <HojaInferior visible onCerrar={onCerrar}>
      <View style={{ gap: 2 }}>
        {opciones.map((o) => (
          <Pressable
            key={o.texto}
            style={styles.opcion}
            onPress={() => {
              onCerrar();
              setTimeout(o.accion, 220);
            }}
            accessibilityRole="button"
          >
            <Ionicons name={o.icono} size={22} color={colores.texto} />
            <Text style={styles.texto}>{o.texto}</Text>
          </Pressable>
        ))}
      </View>
    </HojaInferior>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    opcion: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 52 },
    texto: { ...tipografia.cuerpoDestacado, fontSize: 15.5, color: colores.texto },
  });
}
