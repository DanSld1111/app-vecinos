import { useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CIERRES_CLASIFICADO, ClasificadoPropio, ETIQUETA_SUBTIPO, SECCIONES_CLASIFICADO } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { cerrarClasificado, renovarClasificado, useMisClasificados, useRefrescarClasificados } from "../../src/datos/hooks/useClasificados";
import { useSesion } from "../../src/estado/useSesion";
import { urlCompleta } from "../../src/utilidades/media";
import { Boton, Cabecera, ICONO_SECCION, PedirSesion, vence } from "../../src/componentes/avisos/comun";
import { SinFoto } from "../../src/componentes/SinFoto";

/** Cómo se ve el estado de cada aviso propio. */
function estado(c: ClasificadoPropio): { texto: string; fondo: string; color: string } {
  if (c.estado === "pendiente") return { texto: "En revisión", fondo: "#fbefd2", color: "#7a5200" };
  if (c.estado === "rechazado") return { texto: "No se publicó", fondo: "#fbe2de", color: "#a3301b" };
  if (c.estado === "cerrado") {
    const cierre = Object.values(CIERRES_CLASIFICADO).flat().find((x) => x.id === c.cierre)?.etiqueta.replace(/^Ya /, "") ?? "cerrado";
    return { texto: `Cerrado · ${cierre}`, fondo: "#ecebe5", color: "#3e4a43" };
  }
  if (c.venceEn && new Date(c.venceEn) < new Date()) return { texto: "Venció", fondo: "#ecebe5", color: "#3e4a43" };
  return { texto: `Publicado · ${vence(c.venceEn)}`, fondo: "#e6f1e6", color: "#1a531a" };
}

/** «Mis avisos»: lo que el vecino envió, en qué va, y renovar o cerrar los publicados. */
export default function MisAvisos() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const token = useSesion((e) => e.token);
  const { enviado } = useLocalSearchParams<{ enviado?: string }>();
  const { data, isLoading, isRefetching, refetch } = useMisClasificados();
  const refrescar = useRefrescarClasificados();
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function accion(id: string, fn: () => Promise<unknown>) {
    setOcupado(id);
    try {
      await fn();
      refrescar();
    } finally {
      setOcupado(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Cabecera titulo="Mis avisos" onVolver={() => (router.canGoBack() && !enviado ? router.back() : router.replace("/perfil"))} />
      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + espaciado.xl }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colores.primario} />}
      >
        {enviado ? (
          <View style={styles.enviado}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={34} color={colores.primario} />
            </View>
            <Text style={styles.enviadoTitulo}>¡Recibimos tu aviso!</Text>
            <Text style={styles.enviadoTexto}>Lo revisamos en menos de 24 horas. Si falta algo, te escribimos por WhatsApp.</Text>
          </View>
        ) : null}

        {!token ? (
          <PedirSesion texto="Inicia sesión para ver los avisos que enviaste." />
        ) : isLoading ? (
          <ActivityIndicator color={colores.primario} style={{ marginTop: espaciado.xl }} />
        ) : data && data.length ? (
          data.map((c) => {
            const e = estado(c);
            const foto = urlCompleta(c.fotos[0]);
            const publicado = c.estado === "publicado";
            return (
              <View key={c.id} style={styles.tarjeta}>
                <Pressable
                  onPress={() => (publicado ? router.push(`/avisos/aviso/${c.id}`) : undefined)}
                  style={styles.fila}
                  accessibilityRole={publicado ? "button" : undefined}
                >
                  {foto ? <Image source={{ uri: foto }} style={styles.foto} /> : <SinFoto icono={ICONO_SECCION[c.seccion]} style={styles.foto} />}
                  <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                    <Text style={styles.titulo} numberOfLines={2}>
                      {c.titulo || `${SECCIONES_CLASIFICADO[c.seccion]} · ${ETIQUETA_SUBTIPO[c.subtipo]}`}
                    </Text>
                    <Text style={[styles.estado, { backgroundColor: e.fondo, color: e.color }]}>{e.texto}</Text>
                    {publicado ? (
                      <Text style={styles.meta}>
                        {c.vistas} {c.vistas === 1 ? "vista" : "vistas"} · {c.contactos} {c.contactos === 1 ? "contacto" : "contactos"}
                      </Text>
                    ) : null}
                    {c.estado === "rechazado" && c.motivoRechazo ? <Text style={styles.meta}>{c.motivoRechazo}</Text> : null}
                  </View>
                </Pressable>
                {publicado && token ? (
                  <View style={styles.acciones}>
                    <Boton texto="Renovar 30 días" tipo="secundario" deshabilitado={ocupado === c.id} onPress={() => accion(c.id, () => renovarClasificado(c.id, token))} style={{ flex: 1 }} />
                    <Boton
                      texto={CIERRES_CLASIFICADO[c.seccion][0].etiqueta}
                      tipo="suave"
                      deshabilitado={ocupado === c.id}
                      onPress={() => accion(c.id, () => cerrarClasificado(c.id, CIERRES_CLASIFICADO[c.seccion][0].id, token))}
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.vacio}>
            <Text style={styles.enviadoTexto}>Todavía no enviaste ningún aviso.</Text>
          </View>
        )}

        <Boton texto="Enviar un aviso" icono="add" onPress={() => router.push("/avisos/enviar")} style={{ marginTop: espaciado.sm }} />
      </ScrollView>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenido: { padding: espaciado.md, gap: 10, width: "100%", maxWidth: 640, alignSelf: "center" },
    enviado: { alignItems: "center", gap: 8, paddingVertical: espaciado.lg, paddingHorizontal: espaciado.md, marginBottom: espaciado.sm, backgroundColor: colores.superficie, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colores.borde },
    check: { width: 68, height: 68, borderRadius: 34, backgroundColor: colores.superficieHundida, alignItems: "center", justifyContent: "center" },
    enviadoTitulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 21, color: colores.texto },
    enviadoTexto: { ...tipografia.cuerpo, color: colores.textoSuave, textAlign: "center" },
    tarjeta: { backgroundColor: colores.superficie, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colores.borde, padding: 12, gap: 10 },
    fila: { flexDirection: "row", gap: 12, alignItems: "center" },
    foto: { width: 64, height: 64, borderRadius: 10, backgroundColor: colores.superficieHundida },
    titulo: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14, color: colores.texto },
    estado: { alignSelf: "flex-start", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: "hidden" },
    meta: { ...tipografia.pie, fontSize: 12, color: colores.textoSuave },
    acciones: { flexDirection: "row", gap: 8 },
    vacio: { padding: espaciado.lg },
  });
}
