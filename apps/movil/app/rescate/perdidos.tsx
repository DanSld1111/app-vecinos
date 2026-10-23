import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TipoAvisoMascota } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { useInicioRescate } from "../../src/datos/hooks/useRescate";
import { BotonRescate, Cabecera, Segmentos, TarjetaAviso } from "../../src/componentes/rescate/comun";

/** Perdidos y encontrados (decisión 0097): los avisos abiertos de la comunidad. */
export default function Perdidos() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useInicioRescate();
  const [tipo, setTipo] = useState<TipoAvisoMascota>("perdido");
  const avisos = (data?.avisos ?? []).filter((a) => a.tipo === tipo);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Cabecera titulo="Perdidos y encontrados" />
      <ScrollView contentContainerStyle={{ padding: espaciado.lg, gap: 10, paddingBottom: 170 }}>
        <Segmentos<TipoAvisoMascota>
          etiqueta="Tipo de aviso"
          valor={tipo}
          onCambiar={setTipo}
          opciones={[
            { id: "perdido", texto: "Perdidos" },
            { id: "encontrado", texto: "Encontrados" },
          ]}
        />
        <Text style={styles.resumen}>
          {tipo === "perdido"
            ? avisos.length === 1 ? "1 mascota perdida en tu comunidad" : `${avisos.length} mascotas perdidas en tu comunidad`
            : avisos.length === 1 ? "1 mascota encontrada en tu comunidad" : `${avisos.length} mascotas encontradas en tu comunidad`}
        </Text>
        {isLoading ? <ActivityIndicator color={colores.primario} /> : null}
        {!isLoading && !avisos.length ? (
          <Text style={styles.vacio}>{tipo === "perdido" ? "No hay mascotas perdidas reportadas. ¡Ojalá siga así!" : "Nadie reportó mascotas encontradas por ahora."}</Text>
        ) : null}
        {avisos.map((a) => (
          <TarjetaAviso key={a.id} a={a} onPress={() => router.push(`/rescate/aviso/${a.id}`)} />
        ))}
      </ScrollView>
      <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.nota}>Al publicar, el aviso sale en el Inicio de los vecinos. Cuando aparezca, márcalo como «Ya volvió a casa».</Text>
        <BotonRescate texto="Reportar mascota perdida o encontrada" icono="add" tipo="peligro" onPress={() => router.push("/rescate/reportar")} />
      </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    resumen: { ...tipografia.pie, fontSize: 13, color: colores.textoSuave },
    vacio: { ...tipografia.cuerpo, color: colores.textoSuave, backgroundColor: colores.superficie, borderRadius: 16, padding: espaciado.lg, textAlign: "center" },
    pie: { position: "absolute", left: 0, right: 0, bottom: 0, gap: 8, paddingHorizontal: espaciado.lg, paddingTop: 10, backgroundColor: colores.fondo, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
    nota: { ...tipografia.pie, fontSize: 12.5, lineHeight: 17, color: colores.textoSuave },
  });
}
