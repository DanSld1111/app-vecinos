import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EspecieMascota, TamanoMascota, TipoAvisoMascota } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { crearAviso, subirFotoAviso, useRefrescarRescate } from "../../src/datos/hooks/useRescate";
import { useSesion } from "../../src/estado/useSesion";
import { useUbicacionUsuario } from "../../src/estado/useUbicacionUsuario";
import { elegirImagen } from "../../src/utilidades/elegirImagen";
import { BotonRescate, Cabecera, Chip, PedirSesion, ROJO_AVISO } from "../../src/componentes/rescate/comun";

const MAX_FOTOS = 6;

/** Reportar una mascota perdida o encontrada (decisión 0097), en 3 pasos. Se publica al instante. */
export default function Reportar() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const token = useSesion((e) => e.token);
  const usuario = useSesion((e) => e.usuario);
  const refrescar = useRefrescarRescate();
  const asegurarUbicacion = useUbicacionUsuario((e) => e.asegurarUbicacion);
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState<TipoAvisoMascota>("perdido");
  const [especie, setEspecie] = useState<EspecieMascota>("perro");
  const [fotos, setFotos] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [senas, setSenas] = useState("");
  const [tamano, setTamano] = useState<TamanoMascota | null>(null);
  const [recompensa, setRecompensa] = useState("");
  const [lugar, setLugar] = useState("");
  const [coordenada, setCoordenada] = useState<{ lat: number; lng: number } | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [cuando, setCuando] = useState("");
  const [mostrar, setMostrar] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicadoId, setPublicadoId] = useState<string | null>(null);

  const cerrar = () => (router.canGoBack() ? router.back() : router.replace("/rescate/perdidos"));
  if (!token)
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <Cabecera titulo="Reportar mascota" onVolver={cerrar} />
        <View style={{ padding: espaciado.lg }}>
          <PedirSesion texto="Para publicar un aviso necesitas tu cuenta de vecino: así los avisos no son anónimos y te llegan las pistas." />
        </View>
      </View>
    );

  async function agregarFoto() {
    const archivo = await elegirImagen();
    if (!archivo || !token) return;
    setSubiendo(true);
    setError(null);
    try {
      const { url } = await subirFotoAviso(archivo, token);
      setFotos((l) => [...l, url].slice(0, MAX_FOTOS));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setSubiendo(false);
    }
  }

  async function usarUbicacion() {
    setBuscandoUbicacion(true);
    await asegurarUbicacion({ forzar: true });
    const c = useUbicacionUsuario.getState().coordenada;
    setBuscandoUbicacion(false);
    if (c) setCoordenada(c);
    else setError("No pudimos leer tu ubicación. Escribe una referencia del lugar.");
  }

  async function publicar() {
    if (!token) return;
    setPublicando(true);
    setError(null);
    try {
      const a = await crearAviso(
        { tipo, especie, nombre: nombre.trim(), senas: senas.trim(), tamano, recompensa: recompensa.trim(), fotos, lugar: lugar.trim(), lat: coordenada?.lat ?? null, lng: coordenada?.lng ?? null, cuando: cuando.trim(), mostrarWhatsapp: mostrar },
        token,
      );
      setPublicadoId(a.id);
      refrescar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar. Intenta de nuevo.");
    } finally {
      setPublicando(false);
    }
  }

  const puedeSeguir = paso === 1 ? fotos.length > 0 : paso === 2 ? senas.trim().length >= 5 : lugar.trim().length >= 3;

  if (publicadoId)
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <Cabecera titulo="Reportar mascota" onVolver={() => router.replace("/rescate/perdidos")} />
        <ScrollView contentContainerStyle={styles.publicado}>
          <View style={styles.icono}>
            <Ionicons name="paper-plane-outline" size={38} color={ROJO_AVISO} />
          </View>
          <Text style={styles.tituloPublicado}>Tu aviso ya está publicado</Text>
          <Text style={styles.textoPublicado}>Lo ven los vecinos de tu comunidad en el Inicio y en Perdidos. Cada vez que alguien deje una pista, la verás en «Mi actividad».</Text>
          <BotonRescate texto="Ver mi aviso" style={{ alignSelf: "stretch" }} onPress={() => router.replace(`/rescate/aviso/${publicadoId}`)} />
          <BotonRescate texto="Volver a Perdidos" tipo="secundario" style={{ alignSelf: "stretch" }} onPress={() => router.replace("/rescate/perdidos")} />
        </ScrollView>
      </View>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Cabecera titulo="Reportar mascota" onVolver={cerrar} />
      <View style={styles.pasos}>
        {["Qué pasó", "Cómo es", "Dónde y contacto"].map((p, i) => (
          <View key={p} style={{ flex: 1, gap: 6 }}>
            <View style={[styles.barraPaso, i < paso && { backgroundColor: ROJO_AVISO }]} />
            <Text style={[styles.textoPaso, i < paso && { color: colores.texto }]}>{p}</Text>
          </View>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: espaciado.lg, gap: 18, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {paso === 1 ? (
          <>
            <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Qué pasó">
              <Text style={styles.pregunta}>¿Qué pasó?</Text>
              {[
                { id: "perdido" as const, titulo: "Perdí a mi mascota", texto: "Se publica como «Se busca», en rojo" },
                { id: "encontrado" as const, titulo: "Encontré una mascota", texto: "Se publica como «Encontrado», para que su familia la ubique" },
              ].map((o) => {
                const activo = tipo === o.id;
                return (
                  <Pressable key={o.id} onPress={() => setTipo(o.id)} style={[styles.opcionGrande, activo && styles.opcionActiva]} accessibilityRole="radio" accessibilityState={{ checked: activo }}>
                    <Text style={styles.opcionTitulo}>{o.titulo}</Text>
                    <Text style={styles.nota}>{o.texto}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ gap: 8 }}>
              <Text style={styles.pregunta}>Es un…</Text>
              <View style={styles.fila}>
                {(["perro", "gato", "otro"] as const).map((e) => (
                  <Chip key={e} texto={e === "perro" ? "Perro" : e === "gato" ? "Gato" : "Otro"} activo={especie === e} onPress={() => setEspecie(e)} />
                ))}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <Text style={styles.pregunta}>
                Fotos <Text style={styles.nota}>· la más clara primero</Text>
              </Text>
              <View style={styles.fotos}>
                {fotos.map((f) => (
                  <View key={f}>
                    <Image source={{ uri: f }} style={styles.foto} />
                    <Pressable onPress={() => setFotos((l) => l.filter((x) => x !== f))} style={styles.quitar} accessibilityRole="button" accessibilityLabel="Quitar foto">
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                ))}
                {fotos.length < MAX_FOTOS ? (
                  <Pressable onPress={agregarFoto} disabled={subiendo} style={[styles.foto, styles.agregar]} accessibilityRole="button">
                    {subiendo ? <ActivityIndicator color={colores.primario} /> : <Ionicons name="camera-outline" size={26} color={colores.primario} />}
                    <Text style={styles.agregarTexto}>{subiendo ? "Subiendo" : "+ Foto"}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </>
        ) : null}

        {paso === 2 ? (
          <>
            <View style={{ gap: 6 }}>
              <Text style={styles.pregunta}>
                Nombre <Text style={styles.nota}>· si lo sabes</Text>
              </Text>
              <TextInput value={nombre} onChangeText={setNombre} maxLength={40} style={styles.entrada} placeholder={tipo === "perdido" ? "Ej.: Max" : "Si tenía placa con nombre"} placeholderTextColor={colores.textoTenue} />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={styles.pregunta}>Señas para reconocerlo</Text>
              <TextInput
                value={senas}
                onChangeText={setSenas}
                multiline
                maxLength={500}
                style={[styles.entrada, { minHeight: 90, textAlignVertical: "top", paddingTop: 12 }]}
                placeholder="Color, raza, collar, si es miedoso…"
                placeholderTextColor={colores.textoTenue}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={styles.pregunta}>Tamaño</Text>
              <View style={styles.fila}>
                {(["pequeno", "mediano", "grande"] as const).map((t) => (
                  <Chip key={t} texto={t === "pequeno" ? "Pequeño" : t === "mediano" ? "Mediano" : "Grande"} activo={tamano === t} onPress={() => setTamano(tamano === t ? null : t)} />
                ))}
              </View>
            </View>
            {tipo === "perdido" ? (
              <View style={{ gap: 6 }}>
                <Text style={styles.pregunta}>
                  Recompensa <Text style={styles.nota}>· opcional</Text>
                </Text>
                <TextInput value={recompensa} onChangeText={setRecompensa} maxLength={60} style={styles.entrada} placeholder="Ej.: S/ 200" placeholderTextColor={colores.textoTenue} />
              </View>
            ) : null}
          </>
        ) : null}

        {paso === 3 ? (
          <>
            <View style={{ gap: 6 }}>
              <Text style={styles.pregunta}>{tipo === "perdido" ? "¿Dónde lo viste por última vez?" : "¿Dónde lo encontraste?"}</Text>
              <TextInput value={lugar} onChangeText={setLugar} maxLength={160} style={styles.entrada} placeholder="Ej.: Cerca al parque de la Felicidad" placeholderTextColor={colores.textoTenue} />
              <Pressable onPress={usarUbicacion} style={styles.ubicacion} accessibilityRole="button" disabled={buscandoUbicacion}>
                <Ionicons name={coordenada ? "checkmark-circle" : "locate-outline"} size={18} color={colores.primario} />
                <Text style={styles.ubicacionTexto}>{buscandoUbicacion ? "Buscando tu ubicación…" : coordenada ? "Ubicación agregada (estás ahí ahora)" : "Usar mi ubicación actual"}</Text>
              </Pressable>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={styles.pregunta}>¿Cuándo?</Text>
              <TextInput value={cuando} onChangeText={setCuando} maxLength={60} style={styles.entrada} placeholder="Ej.: Ayer, 7:30 p. m." placeholderTextColor={colores.textoTenue} />
            </View>
            <View style={styles.contacto}>
              <Text style={styles.pregunta}>Cómo te contactan</Text>
              <Text style={styles.nota}>Tu WhatsApp de la cuenta: {usuario?.telefono ? `•••• ${usuario.telefono.slice(-3)}` : "no registrado"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Switch value={mostrar} onValueChange={setMostrar} trackColor={{ true: colores.primario, false: colores.bordeFuerte }} thumbColor="#ffffff" accessibilityLabel="Mostrar mi WhatsApp en el aviso" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.opcionTitulo}>Mostrar mi WhatsApp en el aviso</Text>
                  <Text style={styles.nota}>{mostrar ? "Quien lo vea podrá escribirte directo." : "Nadie verá tu número: las pistas te llegan solo en la app."}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}
        {error ? <Text style={[styles.nota, { color: colores.error }]}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {paso > 1 ? <BotonRescate texto="Atrás" tipo="secundario" style={{ flex: 1 }} onPress={() => setPaso(paso - 1)} /> : null}
        <BotonRescate
          texto={paso === 3 ? (publicando ? "Publicando…" : "Publicar aviso") : "Siguiente"}
          tipo={paso === 3 ? "peligro" : "principal"}
          style={{ flex: 2 }}
          deshabilitado={!puedeSeguir || publicando || subiendo}
          onPress={() => (paso === 3 ? publicar() : setPaso(paso + 1))}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    pasos: { flexDirection: "row", gap: 6, paddingHorizontal: espaciado.lg, paddingTop: 12 },
    barraPaso: { height: 6, borderRadius: 3, backgroundColor: colores.bordeFuerte },
    textoPaso: { ...tipografia.pie, fontSize: 12, fontFamily: "SchibstedGrotesk_700Bold", color: colores.textoSuave },
    pregunta: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 16, color: colores.texto },
    nota: { ...tipografia.pie, fontSize: 13, lineHeight: 18, color: colores.textoSuave, fontFamily: "SchibstedGrotesk_400Regular" },
    opcionGrande: { minHeight: 64, borderRadius: 16, borderWidth: 2, borderColor: colores.bordeFuerte, padding: 12, gap: 2, backgroundColor: colores.superficie },
    opcionActiva: { borderColor: ROJO_AVISO, backgroundColor: "#fff4ef" },
    opcionTitulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: colores.texto },
    fila: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    fotos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    foto: { width: 100, height: 100, borderRadius: 12 },
    quitar: { position: "absolute", top: 4, right: 4, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
    agregar: { borderWidth: 2, borderStyle: "dashed", borderColor: colores.bordeFuerte, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: colores.superficie },
    agregarTexto: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 12.5, color: colores.primario },
    entrada: { ...tipografia.cuerpo, fontSize: 15, minHeight: 48, borderWidth: 1.5, borderColor: colores.bordeFuerte, borderRadius: 12, paddingHorizontal: 12, color: colores.texto, backgroundColor: colores.superficie },
    ubicacion: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
    ubicacionTexto: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14, color: colores.primario },
    contacto: { backgroundColor: colores.superficieHundida, borderRadius: 16, padding: 14, gap: 10 },
    pie: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 8, paddingHorizontal: espaciado.lg, paddingTop: 12, backgroundColor: colores.fondo, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
    publicado: { padding: espaciado.lg, paddingTop: 40, alignItems: "center", gap: 12 },
    icono: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#fdeee8", alignItems: "center", justifyContent: "center" },
    tituloPublicado: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 23, color: colores.texto, textAlign: "center" },
    textoPublicado: { ...tipografia.cuerpo, fontSize: 14.5, lineHeight: 21, color: colores.textoSuave, textAlign: "center" },
  });
}
