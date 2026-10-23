import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { edadMascota } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { useInicioRescate } from "../../src/datos/hooks/useRescate";
import { urlCompleta } from "../../src/utilidades/media";
import { abrirWhatsapp } from "../../src/utilidades/whatsapp";
import { BotonRescate, Cabecera, Chip, ROJO_AVISO, Segmentos } from "../../src/componentes/rescate/comun";
import { partesFecha, horaLegible } from "../../src/componentes/fichasRubro/utilidades";

type Forma = "apadrinar" | "donar" | "voluntario";

/** Ayudar a un albergue (decisión 0097): apadrinar, donar lo que necesitan o ir de voluntario. */
export default function Ayudar() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useInicioRescate();
  const [forma, setForma] = useState<Forma>("apadrinar");
  const [albergueId, setAlbergueId] = useState<string | null>(null);

  const albergues = data?.albergues ?? [];
  const albergue = albergues.find((a) => a.id === albergueId) ?? albergues[0];
  const apadrinables = (data?.mascotas ?? [])
    .filter((m) => m.apadrinable && m.albergue.id === albergue?.id)
    // Primero las urgentes y las mayores: son las que más tardan en ser adoptadas.
    .sort((a, b) => Number(b.urgente) - Number(a.urgente) || (b.edadUnidad === "anios" ? b.edadValor ?? 0 : 0) - (a.edadUnidad === "anios" ? a.edadValor ?? 0 : 0));
  const hoy = new Date().toLocaleDateString("en-CA");
  const turnos = (albergue?.datos.turnos ?? []).filter((t) => t.fecha >= hoy);
  const necesidades = albergue?.datos.necesidades ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Cabecera titulo="Ayudar" subtitulo="No todos pueden adoptar, pero todos pueden ayudar" />
      {isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color={colores.primario} /> : null}
      {!isLoading && !albergue ? <Text style={[styles.vacio, { margin: espaciado.lg }]}>Todavía no hay albergues en tu comunidad.</Text> : null}
      {albergue ? (
        <ScrollView contentContainerStyle={{ padding: espaciado.lg, gap: 14, paddingBottom: insets.bottom + 40 }}>
          {albergues.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {albergues.map((a) => (
                <Chip key={a.id} texto={a.nombre} activo={a.id === albergue.id} onPress={() => setAlbergueId(a.id)} />
              ))}
            </ScrollView>
          ) : null}
          <Segmentos<Forma>
            etiqueta="Cómo ayudar"
            valor={forma}
            onCambiar={setForma}
            opciones={[
              { id: "apadrinar", texto: "Apadrinar" },
              { id: "donar", texto: "Donar" },
              { id: "voluntario", texto: "Voluntario" },
            ]}
          />

          {forma === "apadrinar" ? (
            <>
              <Text style={styles.nota}>Con un aporte al mes cubres la comida y las medicinas de una mascota mientras encuentra hogar.</Text>
              {apadrinables.length ? (
                apadrinables.map((m) => (
                  <Pressable key={m.id} style={styles.fila} onPress={() => router.push(`/rescate/apadrinar/${m.id}`)} accessibilityRole="button">
                    {m.fotoUrl ? <Image source={{ uri: urlCompleta(m.fotoUrl) }} style={styles.foto} /> : <View style={[styles.foto, { backgroundColor: colores.superficieHundida }]} />}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.titulo}>Apadrina a {m.nombre}</Text>
                      <Text style={styles.nota}>
                        {edadMascota(m)}
                        {m.urgente ? " · necesita ayuda ya" : ""}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colores.texto} />
                  </Pressable>
                ))
              ) : (
                <Text style={styles.vacio}>Este albergue no tiene mascotas para apadrinar por ahora.</Text>
              )}
            </>
          ) : null}

          {forma === "donar" ? (
            <>
              <Text style={styles.subtitulo}>Lo que necesita {albergue.nombre}</Text>
              {necesidades.length ? (
                necesidades.map((n) => {
                  const p = Math.min(1, n.tiene / Math.max(1, n.meta));
                  const urgente = p < 0.3;
                  return (
                    <View key={n.que} style={styles.caja}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                        <Text style={styles.titulo}>{n.que}</Text>
                        <Text style={[styles.estado, { color: urgente ? ROJO_AVISO : colores.primario }]}>
                          {urgente ? "Urgente" : p >= 0.85 ? "Casi listo" : `Faltan ${n.meta - n.tiene} ${n.unidad}`}
                        </Text>
                      </View>
                      <View style={styles.barra}>
                        <View style={[styles.relleno, { width: `${Math.round(p * 100)}%`, backgroundColor: urgente ? ROJO_AVISO : colores.primario }]} />
                      </View>
                      <Text style={styles.nota}>
                        Tienen {n.tiene} de {n.meta} {n.unidad} este mes
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.vacio}>El albergue todavía no publicó sus necesidades. Escríbeles para preguntar qué les hace falta.</Text>
              )}
              {albergue.datos.yape ? (
                <View style={styles.caja}>
                  <Text style={styles.titulo}>Donar dinero</Text>
                  <Text style={styles.nota}>
                    Yape o Plin al <Text style={{ fontFamily: "SchibstedGrotesk_800ExtraBold", color: colores.texto }} selectable>{albergue.datos.yape}</Text>
                    {albergue.datos.titular ? ` a nombre de ${albergue.datos.titular}` : ""}.
                  </Text>
                </View>
              ) : null}
              {albergue.whatsapp ? (
                <BotonRescate texto="Coordinar entrega por WhatsApp" icono="logo-whatsapp" onPress={() => abrirWhatsapp(albergue.whatsapp, `Hola, ${albergue.nombre}. Quiero donar para el albergue (lo vi en ELISUR). ¿Cómo coordinamos la entrega?`)} />
              ) : null}
            </>
          ) : null}

          {forma === "voluntario" ? (
            <>
              <Text style={styles.subtitulo}>Turnos que necesitan manos</Text>
              {turnos.length ? (
                turnos.map((t) => {
                  const f = partesFecha(t.fecha);
                  return (
                    <View key={t.fecha + t.hora + t.que} style={styles.fila}>
                      <View style={styles.fecha}>
                        <Text style={styles.fechaDia}>{f.dia}</Text>
                        <Text style={styles.fechaNum}>{f.fecha.split(" ")[0]}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.titulo}>{t.que}</Text>
                        <Text style={styles.nota}>
                          {horaLegible(t.hora)}
                          {t.faltan ? ` · faltan ${t.faltan === 1 ? "1 persona" : `${t.faltan} personas`}` : ""}
                        </Text>
                      </View>
                      {albergue.whatsapp ? (
                        <Pressable
                          style={styles.apunto}
                          accessibilityRole="button"
                          onPress={() => abrirWhatsapp(albergue.whatsapp, `Hola, quiero apuntarme al turno «${t.que}» del ${f.dia.toLowerCase()} ${f.fecha} a las ${horaLegible(t.hora)} (lo vi en ELISUR).`)}
                        >
                          <Text style={styles.apuntoTexto}>Me apunto</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.vacio}>No hay turnos publicados por ahora.</Text>
              )}
              {albergue.whatsapp ? (
                <Pressable
                  style={styles.fila}
                  accessibilityRole="button"
                  onPress={() => abrirWhatsapp(albergue.whatsapp, `Hola, ${albergue.nombre}. Me interesa ser hogar temporal (lo vi en ELISUR). ¿Qué necesitan?`)}
                >
                  <Ionicons name="home-outline" size={28} color={colores.primario} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.titulo}>Hogar temporal</Text>
                    <Text style={styles.nota}>Recibe a una mascota unas semanas mientras encuentra familia. Escríbele al albergue.</Text>
                  </View>
                  <Ionicons name="logo-whatsapp" size={20} color={colores.primario} />
                </Pressable>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    nota: { ...tipografia.pie, fontSize: 13, lineHeight: 19, color: colores.textoSuave },
    vacio: { ...tipografia.cuerpo, color: colores.textoSuave, backgroundColor: colores.superficie, borderRadius: 16, padding: espaciado.lg, textAlign: "center" },
    subtitulo: { ...tipografia.subtitulo, fontSize: 17, color: colores.texto },
    titulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: colores.texto, flexShrink: 1 },
    fila: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.superficie, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colores.borde },
    foto: { width: 64, height: 64, borderRadius: 14 },
    caja: { backgroundColor: colores.superficie, borderRadius: 16, padding: 14, gap: 8, borderWidth: 1, borderColor: colores.borde },
    estado: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12.5 },
    barra: { height: 10, borderRadius: 5, backgroundColor: colores.borde, overflow: "hidden" },
    relleno: { height: "100%", borderRadius: 5 },
    fecha: { width: 54, borderRadius: 12, paddingVertical: 6, alignItems: "center", backgroundColor: colores.primarioSuave },
    fechaDia: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 11.5, color: colores.primarioFuerte },
    fechaNum: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 17, color: colores.primarioFuerte },
    apunto: { minHeight: 40, borderRadius: 20, paddingHorizontal: 14, backgroundColor: colores.primario, justifyContent: "center" },
    apuntoTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 13, color: "#ffffff" },
  });
}
