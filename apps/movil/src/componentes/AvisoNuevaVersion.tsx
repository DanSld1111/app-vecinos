import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";

// La versión con la que se construyó este bundle (construir-web.js). En desarrollo no existe.
const VERSION = process.env.EXPO_PUBLIC_VERSION_APP;
const CADA_MS = 5 * 60 * 1000;
const CLAVE_RECARGA = "elisur-recargada-para";

async function versionPublicada(): Promise<string | null> {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return null;
    return ((await r.json()) as { version?: string }).version ?? null;
  } catch {
    return null;
  }
}

/** Recarga una sola vez por versión: si el servidor tarda en servir la nueva, no se queda en bucle. */
function recargarPara(version: string): boolean {
  try {
    if (sessionStorage.getItem(CLAVE_RECARGA) === version) return false;
    sessionStorage.setItem(CLAVE_RECARGA, version);
  } catch {
    // Sin sessionStorage: se recarga igual.
  }
  window.location.reload();
  return true;
}

/**
 * Versión nueva publicada (decisión 0095), solo en la PWA. Al volver a la app (estaba en segundo
 * plano) se recarga sola; si el vecino la está usando, aparece un aviso para actualizar cuando quiera.
 */
export function AvisoNuevaVersion() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [nueva, setNueva] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !VERSION || typeof document === "undefined") return;

    async function revisar(alVolver: boolean) {
      const publicada = await versionPublicada();
      if (!publicada || publicada === VERSION) return;
      if (alVolver && recargarPara(publicada)) return;
      setNueva(publicada);
    }

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") revisar(true);
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    const primera = setTimeout(() => revisar(false), 15000);
    const intervalo = setInterval(() => document.visibilityState === "visible" && revisar(false), CADA_MS);
    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      clearTimeout(primera);
      clearInterval(intervalo);
    };
  }, []);

  if (!nueva) return null;
  return (
    <View style={styles.contenedor} accessibilityRole="alert">
      <Ionicons name="sparkles-outline" size={16} color="#ffffff" />
      <Text style={styles.texto}>Hay una versión nueva de ELISUR</Text>
      <Pressable
        style={styles.boton}
        onPress={() => {
          try {
            sessionStorage.setItem(CLAVE_RECARGA, nueva);
          } catch {
            // nada
          }
          window.location.reload();
        }}
        accessibilityRole="button"
      >
        <Text style={styles.botonTexto}>Actualizar</Text>
      </Pressable>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: espaciado.sm,
      backgroundColor: colores.primario,
      paddingVertical: 8,
      paddingHorizontal: espaciado.md,
    },
    texto: { ...tipografia.pie, fontSize: 13, fontFamily: "SchibstedGrotesk_600SemiBold", color: "#ffffff", flexShrink: 1 },
    boton: { backgroundColor: "#ffffff", borderRadius: 99, paddingHorizontal: 14, minHeight: 32, justifyContent: "center" },
    botonTexto: { ...tipografia.pie, fontSize: 13, fontFamily: "SchibstedGrotesk_800ExtraBold", color: colores.primarioFuerte },
  });
}
