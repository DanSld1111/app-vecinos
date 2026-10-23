import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Padrinazgo } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../../src/disenio";
import { apadrinar, useMascota, useRefrescarRescate } from "../../../src/datos/hooks/useRescate";
import { useSesion } from "../../../src/estado/useSesion";
import { urlCompleta } from "../../../src/utilidades/media";
import { abrirWhatsapp } from "../../../src/utilidades/whatsapp";
import { BotonRescate, Cabecera, PedirSesion } from "../../../src/componentes/rescate/comun";
import { mensajePadrinazgo } from "../../../src/componentes/rescate/mensajes";

const MONTOS_POR_DEFECTO = [20, 30, 50];

/** En la PWA se copia con el portapapeles del navegador; si no se puede, el número queda seleccionable. */
async function copiar(texto: string): Promise<boolean> {
  try {
    const nav = (globalThis as { navigator?: { clipboard?: { writeText: (t: string) => Promise<void> } } }).navigator;
    if (!nav?.clipboard) return false;
    await nav.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** Apadrinar (decisión 0097): elegir el aporte, yapear al albergue y avisar por WhatsApp. */
export default function Apadrinar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const token = useSesion((e) => e.token);
  const { data: m, isLoading } = useMascota(id);
  const refrescar = useRefrescarRescate();
  const [monto, setMonto] = useState<number | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<Padrinazgo | null>(null);

  if (isLoading || !m) return <ActivityIndicator style={{ marginTop: insets.top + 80 }} color={colores.primario} />;
  const datos = m.datosAlbergue;
  const montos = datos.montosPadrinazgo?.length ? datos.montosPadrinazgo : MONTOS_POR_DEFECTO;
  const elegido = monto ?? montos[Math.min(1, montos.length - 1)];
  const paso = listo ? 2 : 1;

  async function yaPague() {
    if (!token) return;
    setEnviando(true);
    setError(null);
    try {
      setListo(await apadrinar(m!.id, elegido, token));
      refrescar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const cabecera = <Cabecera titulo={`Apadrinar a ${m.nombre}`} subtitulo={m.albergue.nombre} onVolver={() => (router.canGoBack() ? router.back() : router.replace(`/rescate/mascota/${m.id}`))} />;
  if (!token)
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        {cabecera}
        <View style={{ padding: espaciado.lg }}>
          <PedirSesion texto={`Para apadrinar a ${m.nombre} necesitas tu cuenta de vecino: así el albergue sabe de quién es el aporte.`} />
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      {cabecera}
      <ScrollView contentContainerStyle={{ padding: espaciado.lg, gap: 14, paddingBottom: insets.bottom + 40 }}>
        <View style={{ flexDirection: "row", gap: 6 }} accessibilityLabel="Pasos">
          {["Elegir", "Pagar con Yape", "Avisar al albergue"].map((p, i) => (
            <View key={p} style={{ flex: 1, gap: 6 }}>
              <View style={[styles.barraPaso, i <= paso && { backgroundColor: colores.primario }]} />
              <Text style={[styles.textoPaso, i <= paso && { color: colores.texto }]}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.caja}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            {m.fotoUrl ? <Image source={{ uri: urlCompleta(m.fotoUrl) }} style={styles.foto} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.titulo}>{m.nombre}</Text>
              <Text style={styles.nota}>Con tu aporte cubre su comida y sus medicinas. Cada mes el albergue te cuenta cómo está.</Text>
            </View>
          </View>
          {!listo ? (
            <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Aporte mensual">
              {montos.map((n) => {
                const activo = n === elegido;
                return (
                  <Pressable key={n} onPress={() => setMonto(n)} style={[styles.monto, activo && styles.montoActivo]} accessibilityRole="radio" accessibilityState={{ checked: activo }}>
                    <Text style={styles.montoTexto}>S/ {n}</Text>
                    <Text style={styles.nota}>al mes</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        {!listo ? (
          <>
            <View style={styles.caja}>
              <Text style={styles.subtitulo}>1. Yapea o plinea S/ {elegido}</Text>
              {datos.yape ? (
                <View style={styles.numero}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nota}>Número del albergue</Text>
                    <Text style={styles.numeroTexto} selectable>
                      {datos.yape}
                    </Text>
                    {datos.titular ? <Text style={styles.nota}>A nombre de {datos.titular}</Text> : null}
                  </View>
                  <Pressable onPress={async () => setCopiado(await copiar(datos.yape!))} style={styles.copiar} accessibilityRole="button">
                    <Text style={styles.copiarTexto}>{copiado ? "Copiado" : "Copiar"}</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.nota}>El albergue todavía no publicó su Yape o Plin. Registra tu padrinazgo y pídeles el número por WhatsApp.</Text>
              )}
              <Text style={styles.nota}>Pon «Padrino {m.nombre}» en el mensaje del pago. La app no cobra ni guarda datos de tu tarjeta: el dinero va directo al albergue.</Text>
            </View>
            <View style={styles.caja}>
              <Text style={styles.subtitulo}>2. Cuéntale al albergue</Text>
              <Text style={styles.nota}>Cuando hayas pagado, toca «Ya pagué». Quedas como padrino por confirmar y luego mandas la captura por WhatsApp.</Text>
              {error ? <Text style={[styles.nota, { color: colores.error }]}>{error}</Text> : null}
              <BotonRescate texto={enviando ? "Guardando…" : "Ya pagué"} deshabilitado={enviando} onPress={yaPague} />
            </View>
          </>
        ) : (
          <>
            <View style={[styles.caja, { alignItems: "center" }]}>
              <View style={styles.corazon}>
                <Ionicons name="heart" size={30} color={colores.primario} />
              </View>
              <Text style={[styles.titulo, { fontSize: 20, textAlign: "center" }]}>¡Gracias por apadrinar a {m.nombre}!</Text>
              <Text style={[styles.nota, { textAlign: "center" }]}>Tu padrinazgo N.º {listo.numero} queda por confirmar hasta que el albergue vea el pago. Lo sigues en «Mi actividad».</Text>
            </View>
            {listo.albergueWhatsapp ? (
              <BotonRescate texto="Abrir WhatsApp y enviar captura" icono="logo-whatsapp" onPress={() => abrirWhatsapp(listo.albergueWhatsapp, mensajePadrinazgo(listo))} />
            ) : null}
            <BotonRescate texto="Ver «Mi actividad»" tipo="secundario" onPress={() => router.replace("/rescate/actividad")} />
          </>
        )}

        <View style={styles.siguiente}>
          <Text style={[styles.subtitulo, { fontSize: 14 }]}>¿Y el mes siguiente?</Text>
          <Text style={styles.nota}>Vuelve aquí, yapea y toca «Ya pagué» otra vez. Puedes dejar de apadrinar cuando quieras desde «Mi actividad».</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    barraPaso: { height: 6, borderRadius: 3, backgroundColor: colores.bordeFuerte },
    textoPaso: { ...tipografia.pie, fontSize: 12, fontFamily: "SchibstedGrotesk_700Bold", color: colores.textoSuave },
    caja: { backgroundColor: colores.superficie, borderRadius: 18, padding: 14, gap: 10, borderWidth: 1, borderColor: colores.borde },
    foto: { width: 64, height: 64, borderRadius: 14 },
    titulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 17, color: colores.texto },
    subtitulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 16, color: colores.texto },
    nota: { ...tipografia.pie, fontSize: 13, lineHeight: 19, color: colores.textoSuave },
    monto: { flex: 1, minHeight: 68, borderRadius: 16, borderWidth: 2, borderColor: colores.bordeFuerte, alignItems: "center", justifyContent: "center" },
    montoActivo: { borderColor: colores.primario, backgroundColor: colores.primarioSuave },
    montoTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 19, color: colores.texto },
    numero: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colores.superficieHundida, borderRadius: 12, padding: 12 },
    numeroTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 20, color: colores.texto },
    copiar: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: colores.texto, justifyContent: "center" },
    copiarTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 13, color: colores.texto },
    corazon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colores.primarioSuave, alignItems: "center", justifyContent: "center" },
    siguiente: { backgroundColor: colores.superficieHundida, borderRadius: 16, padding: 12, gap: 4 },
  });
}
