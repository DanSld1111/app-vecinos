import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ESPECIES_CLASIFICADO, SECCIONES_CLASIFICADO, SUBTIPOS_CLASIFICADO, SeccionClasificado, SubtipoClasificado, TIPOS_INMUEBLE } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { useClasificados } from "../../src/datos/hooks/useClasificados";
import { Cabecera, Chip, Segmentos, TarjetaClasificado } from "../../src/componentes/avisos/comun";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";
import { EstadoError } from "../../src/componentes/EstadoError";

const SECCIONES: SeccionClasificado[] = ["inmuebles", "mascotas", "turismo"];

/** Turismo no se parte en pestañas: «Todas» y los tipos van como chips. */
const TODOS = "todos";

/** Los avisos de una sección, uno tras otro como en un grupo de vecinos (decisión 0098). */
export default function SeccionAvisos() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ancho = Math.min(width, 640);
  const { seccion: param, subtipo: subtipoInicial } = useLocalSearchParams<{ seccion: string; subtipo?: string }>();
  const seccion: SeccionClasificado = SECCIONES.includes(param as SeccionClasificado) ? (param as SeccionClasificado) : "inmuebles";
  const subtipos = SUBTIPOS_CLASIFICADO[seccion];
  const conPestanas = seccion !== "turismo";
  const [subtipo, setSubtipo] = useState<string>(
    subtipos.some((s) => s.id === subtipoInicial) ? (subtipoInicial as string) : conPestanas ? subtipos[0].id : TODOS,
  );
  const [tipo, setTipo] = useState<string | null>(null);
  const filtro = { seccion, subtipo: subtipo === TODOS ? undefined : (subtipo as SubtipoClasificado), tipo: tipo ?? undefined };
  const { data, isLoading, isError, isRefetching, refetch } = useClasificados(filtro);
  // Las cuentas de las pestañas salen de la sección completa (sin filtrar por subtipo).
  const { data: todos } = useClasificados({ seccion }, conPestanas);
  const cuenta = (id: string) => (todos ?? []).filter((c) => c.subtipo === id).length;

  const tipos = seccion === "inmuebles" ? TIPOS_INMUEBLE.slice(0, 4) : seccion === "mascotas" ? ESPECIES_CLASIFICADO : [];
  const etiquetaTipos = seccion === "mascotas" ? { perro: "Perros", gato: "Gatos", otro: "Otros" } : {};

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Cabecera
        titulo={SECCIONES_CLASIFICADO[seccion]}
        derecha={
          <Pressable onPress={() => router.push(`/avisos/enviar?seccion=${seccion}`)} style={styles.publicar} accessibilityRole="button" accessibilityLabel="Envíanos tu aviso">
            <Ionicons name="add" size={18} color={colores.primario} />
            <Text style={styles.publicarTexto}>Publicar</Text>
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + espaciado.xl }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colores.primario} />}
        stickyHeaderIndices={[0]}
      >
        <View style={styles.filtros}>
          {conPestanas ? (
            <Segmentos
              etiqueta={`Tipo de aviso de ${SECCIONES_CLASIFICADO[seccion]}`}
              opciones={subtipos.map((s) => ({ id: s.id, texto: todos ? `${s.etiqueta} · ${cuenta(s.id)}` : s.etiqueta }))}
              valor={subtipo}
              onCambiar={setSubtipo}
            />
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {conPestanas ? (
              <>
                <Chip texto="Todos" activo={tipo === null} onPress={() => setTipo(null)} />
                {tipos.map((t) => (
                  <Chip key={t.id} texto={(etiquetaTipos as Record<string, string>)[t.id] ?? t.etiqueta} activo={tipo === t.id} onPress={() => setTipo(tipo === t.id ? null : t.id)} />
                ))}
              </>
            ) : (
              <>
                <Chip texto="Próximas salidas" activo={subtipo === TODOS} onPress={() => setSubtipo(TODOS)} />
                {subtipos.map((s) => (
                  <Chip key={s.id} texto={s.etiqueta} activo={subtipo === s.id} onPress={() => setSubtipo(subtipo === s.id ? TODOS : s.id)} />
                ))}
              </>
            )}
          </ScrollView>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colores.primario} style={{ marginTop: espaciado.xl }} />
        ) : isError ? (
          <View style={{ padding: espaciado.lg }}>
            <EstadoError onReintentar={() => refetch()} />
          </View>
        ) : data && data.length ? (
          <View style={styles.lista}>
            {data.map((c) => (
              <View key={c.id} style={{ width: ancho, alignSelf: "center" }}>
                <TarjetaClasificado c={c} ancho={ancho} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ padding: espaciado.lg, gap: espaciado.md }}>
            <EstadoVacio titulo="Todavía no hay avisos aquí." />
            <Text style={styles.vacio}>¿Tienes uno? Envíanoslo y lo publicamos gratis para toda la comunidad.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    publicar: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5, borderColor: colores.primario },
    publicarTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14, color: colores.primario },
    filtros: { backgroundColor: colores.fondo, paddingHorizontal: espaciado.md, paddingTop: espaciado.md, paddingBottom: 10, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
    chips: { gap: 8, paddingRight: espaciado.md },
    lista: { gap: 12, paddingTop: 12 },
    vacio: { ...tipografia.cuerpo, color: colores.textoSuave, textAlign: "center" },
  });
}
