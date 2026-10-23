import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { PaletaColores, espaciado, tipografia, useColores } from "../../disenio";
import { useMascotasDeAlbergue } from "../../datos/hooks/useRescate";
import { BotonRescate, TarjetaMascota } from "./comun";

/** Ficha «Mascotas en adopción» de un albergue (decisión 0097). */
export function FichaMascotas({ negocioId, titulo, busqueda }: { negocioId: string; titulo?: string; busqueda: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const { width } = useWindowDimensions();
  const ancho = Math.floor((Math.min(width, 640) - espaciado.lg * 2 - 10) / 2);
  const { data, isLoading } = useMascotasDeAlbergue(negocioId, true);
  const termino = busqueda.trim().toLowerCase();
  const visibles = (data ?? []).filter((m) => !termino || m.nombre.toLowerCase().includes(termino) || m.personalidad.some((p) => p.toLowerCase().includes(termino)));

  return (
    <View style={{ gap: espaciado.md }}>
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
      {!isLoading && !data?.length ? <Text style={styles.vacio}>Este albergue todavía no publicó mascotas en adopción.</Text> : null}
      <View style={styles.grilla}>
        {visibles.map((m) => (
          <TarjetaMascota key={m.id} m={m} style={{ width: ancho }} onPress={() => router.push(`/rescate/mascota/${m.id}`)} />
        ))}
      </View>
      <BotonRescate texto="Cómo ayudar al albergue" tipo="secundario" icono="hand-left-outline" onPress={() => router.push("/rescate/ayudar")} />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    titulo: { ...tipografia.subtitulo, color: colores.texto },
    vacio: { ...tipografia.cuerpo, color: colores.textoSuave, textAlign: "center", paddingVertical: espaciado.lg },
    grilla: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  });
}
