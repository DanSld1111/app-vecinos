import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EspecieMascota, etapaMascota } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../disenio";
import { useInicioRescate } from "../../datos/hooks/useRescate";
import { useSesion } from "../../estado/useSesion";
import { urlCompleta } from "../../utilidades/media";
import { useAlturaBarra, useDesplazamiento } from "../../utilidades/useDesplazamiento";
import { EsqueletoListaNegocios } from "../EsqueletoNegocio";
import { abrirNegocio } from "../transicion/abrirNegocio";
import { Chip, ROJO_AVISO, Segmentos, TarjetaMascota, hace } from "./comun";

const ANCHO_MAXIMO = 640;
const ETAPAS = ["Cachorro", "Joven", "Adulto", "Senior"] as const;
const PASOS = ["Envías tu solicitud", "Entrevista corta", "Lo conoces", "¡A casa!"];

/**
 * Rescate animal (decisión 0097): adoptar, perdidos y encontrados, y ayudar. Reemplaza al listado
 * genérico de negocios del servicio; los albergues siguen abajo.
 */
export function PantallaRescate({ titulo, fotoServicio }: { titulo: string; fotoServicio?: string | null }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ancho = Math.min(width, ANCHO_MAXIMO);
  const anchoTarjeta = Math.floor((ancho - espaciado.lg * 2 - 10) / 2);
  const desplazamiento = useDesplazamiento();
  const alturaBarra = useAlturaBarra();
  const token = useSesion((e) => e.token);
  const { data, isLoading } = useInicioRescate();
  const [especie, setEspecie] = useState<"todos" | EspecieMascota>("todos");
  const [etapa, setEtapa] = useState<(typeof ETAPAS)[number] | null>(null);

  const mascotas = data?.mascotas ?? [];
  const avisos = data?.avisos ?? [];
  const visibles = useMemo(
    () => mascotas.filter((m) => (especie === "todos" || m.especie === especie) && (!etapa || etapaMascota(m) === etapa)),
    [mascotas, especie, etapa],
  );
  const semana = avisos.filter((a) => Date.now() - new Date(a.creadoEn).getTime() < 7 * 86_400_000).length;
  const buscado = avisos.find((a) => a.tipo === "perdido");
  const portada = urlCompleta(fotoServicio) ?? urlCompleta(mascotas[0]?.fotoUrl);
  const hayGatos = mascotas.some((m) => m.especie === "gato");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      contentContainerStyle={{ paddingBottom: alturaBarra + espaciado.xl }}
      onScroll={desplazamiento.onScroll}
      scrollEventThrottle={16}
    >
      <View style={{ width: ancho, alignSelf: "center" }}>
        <View style={[styles.hero, { paddingTop: insets.top + 70 }]}>
          {portada ? <Image source={{ uri: portada }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colores.primarioFuerte }]} />}
          <View style={styles.velo} />
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/servicios"))}
            style={[styles.volver, { top: insets.top + 12 }]}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={24} color="#141a16" />
          </Pressable>
          {token ? (
            <Pressable onPress={() => router.push("/rescate/actividad")} style={[styles.actividad, { top: insets.top + 12 }]} accessibilityRole="button">
              <Ionicons name="person-outline" size={16} color="#141a16" />
              <Text style={styles.actividadTexto}>Mi actividad</Text>
            </Pressable>
          ) : null}
          <Text style={styles.heroEtiqueta}>{titulo}</Text>
          <Text style={styles.heroTitulo}>Dale un hogar a alguien que te está esperando</Text>
        </View>

        <View style={styles.accesos}>
          {/* Adoptar es esta misma pantalla: la lista está justo abajo. */}
          <View style={[styles.acceso, { backgroundColor: colores.primario, borderColor: colores.primario }]}>
            <Ionicons name="heart-outline" size={24} color="#ffffff" />
            <Text style={[styles.accesoTitulo, { color: "#ffffff" }]}>Adoptar</Text>
            <Text style={[styles.accesoTexto, { color: "rgba(255,255,255,0.9)" }]}>{mascotas.length === 1 ? "1 esperando" : `${mascotas.length} esperando`}</Text>
          </View>
          <Pressable style={styles.acceso} accessibilityRole="button" onPress={() => router.push("/rescate/perdidos")}>
            <Ionicons name="search" size={24} color={ROJO_AVISO} />
            <Text style={styles.accesoTitulo}>Perdidos</Text>
            <Text style={styles.accesoTexto}>{semana ? (semana === 1 ? "1 esta semana" : `${semana} esta semana`) : "Reportar"}</Text>
          </Pressable>
          <Pressable style={styles.acceso} accessibilityRole="button" onPress={() => router.push("/rescate/ayudar")}>
            <Ionicons name="hand-left-outline" size={24} color={colores.primario} />
            <Text style={styles.accesoTitulo}>Ayudar</Text>
            <Text style={styles.accesoTexto}>Dona o apadrina</Text>
          </Pressable>
        </View>

        {buscado ? (
          <Pressable style={styles.buscado} onPress={() => router.push(`/rescate/aviso/${buscado.id}`)} accessibilityRole="button">
            {buscado.fotos[0] ? <Image source={{ uri: urlCompleta(buscado.fotos[0]) }} style={styles.buscadoFoto} /> : null}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.buscadoTitulo}>{buscado.nombre ? `Se busca a ${buscado.nombre}` : "Se busca"}</Text>
              <Text style={styles.buscadoTexto} numberOfLines={2}>
                {`Perdido ${hace(buscado.creadoEn)}: ${buscado.lugar}. ¿Lo viste?`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8f2a16" />
          </Pressable>
        ) : null}

        <View style={styles.seccion}>
          <View style={styles.filaTitulo}>
            <Text style={styles.subtitulo}>Buscan hogar</Text>
            <Text style={styles.contador}>{visibles.length === 1 ? "1 mascota" : `${visibles.length} mascotas`}</Text>
          </View>
          {mascotas.length ? (
            <>
              {hayGatos ? (
                <Segmentos
                  etiqueta="Especie"
                  valor={especie}
                  onCambiar={setEspecie}
                  opciones={[
                    { id: "todos", texto: "Todos" },
                    { id: "perro", texto: "Perros" },
                    { id: "gato", texto: "Gatos" },
                  ]}
                />
              ) : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <Chip texto="Todas las edades" activo={etapa === null} onPress={() => setEtapa(null)} />
                {ETAPAS.map((e) => (
                  <Chip key={e} texto={e} activo={etapa === e} onPress={() => setEtapa(e)} />
                ))}
              </ScrollView>
            </>
          ) : null}
          {isLoading ? <EsqueletoListaNegocios cantidad={2} /> : null}
          {!isLoading && !mascotas.length ? (
            <Text style={styles.vacio}>Todavía no hay mascotas en adopción en tu comunidad. Cuando un albergue publique, aparecerán aquí.</Text>
          ) : null}
          {mascotas.length && !visibles.length ? <Text style={styles.vacio}>No hay ninguna con ese filtro ahora.</Text> : null}
          <View style={styles.grilla}>
            {visibles.map((m) => (
              <TarjetaMascota key={m.id} m={m} style={{ width: anchoTarjeta }} onPress={() => router.push(`/rescate/mascota/${m.id}`)} />
            ))}
          </View>
        </View>

        <View style={[styles.caja, { marginTop: espaciado.lg }]}>
          <Text style={[styles.subtitulo, { fontSize: 16 }]}>Así funciona adoptar</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {PASOS.map((p, i) => (
              <View key={p} style={styles.paso}>
                <Text style={styles.pasoNumero}>{i + 1}</Text>
                <Text style={styles.pasoTexto}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {data?.albergues.length ? (
          <View style={styles.seccion}>
            <Text style={[styles.subtitulo, { fontSize: 17 }]}>Albergues y rescatistas</Text>
            {data.albergues.map((a) => (
              <Pressable key={a.id} style={styles.albergue} onPress={() => abrirNegocio(a.id, { vista: null, url: a.fotoPrincipalUrl, radio: 24 })} accessibilityRole="button">
                {a.fotoPrincipalUrl ? <Image source={{ uri: urlCompleta(a.fotoPrincipalUrl) }} style={styles.albergueFoto} /> : <View style={[styles.albergueFoto, { backgroundColor: colores.superficieHundida }]} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.albergueNombre}>{a.nombre}</Text>
                  <Text style={styles.contador}>{a.enAdopcion === 1 ? "1 en adopción" : `${a.enAdopcion} en adopción`}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colores.textoSuave} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    hero: { minHeight: 250, justifyContent: "flex-end", padding: espaciado.lg, overflow: "hidden" },
    velo: { position: "absolute", left: 0, right: 0, bottom: 0, height: 180, backgroundColor: "rgba(10,20,12,0.55)" },
    volver: { position: "absolute", left: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
    actividad: { position: "absolute", right: 14, minHeight: 40, borderRadius: 20, paddingHorizontal: 14, backgroundColor: "rgba(255,255,255,0.95)", flexDirection: "row", alignItems: "center", gap: 6 },
    actividadTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 13, color: "#141a16" },
    heroEtiqueta: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 13, color: "rgba(255,255,255,0.92)" },
    heroTitulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 27, lineHeight: 31, color: "#ffffff", marginTop: 4 },
    accesos: { flexDirection: "row", gap: 8, paddingHorizontal: espaciado.lg, paddingTop: 14 },
    acceso: { flex: 1, minHeight: 88, borderRadius: 16, padding: 11, gap: 4, backgroundColor: colores.superficie, borderWidth: 1, borderColor: colores.borde },
    accesoTitulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14, color: colores.texto },
    accesoTexto: { ...tipografia.pie, fontSize: 11.5, color: colores.textoSuave },
    buscado: { flexDirection: "row", gap: 12, alignItems: "center", marginHorizontal: espaciado.lg, marginTop: 12, padding: 12, borderRadius: 18, backgroundColor: "#fff4ef", borderWidth: 1, borderColor: "#f2d3c6" },
    buscadoFoto: { width: 60, height: 60, borderRadius: 12 },
    buscadoTitulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14.5, color: "#8f2a16" },
    buscadoTexto: { ...tipografia.pie, fontSize: 12.5, color: "#3c4640" },
    seccion: { paddingHorizontal: espaciado.lg, paddingTop: 20, gap: 10 },
    filaTitulo: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    subtitulo: { ...tipografia.subtitulo, fontSize: 19, color: colores.texto },
    contador: { ...tipografia.pie, fontSize: 13, color: colores.textoSuave },
    vacio: { ...tipografia.cuerpo, color: colores.textoSuave, backgroundColor: colores.superficie, borderRadius: 16, padding: espaciado.lg, textAlign: "center" },
    grilla: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    caja: { marginHorizontal: espaciado.lg, backgroundColor: colores.superficie, borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: colores.borde },
    paso: { flex: 1, alignItems: "center", gap: 6 },
    pasoNumero: { width: 34, height: 34, borderRadius: 17, backgroundColor: colores.primarioSuave, color: colores.primarioFuerte, fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14, textAlign: "center", lineHeight: 34, overflow: "hidden" },
    pasoTexto: { ...tipografia.pie, fontSize: 12, fontFamily: "SchibstedGrotesk_600SemiBold", color: colores.texto, textAlign: "center" },
    albergue: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.superficie, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: colores.borde },
    albergueFoto: { width: 48, height: 48, borderRadius: 24 },
    albergueNombre: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14.5, color: colores.texto },
  });
}
