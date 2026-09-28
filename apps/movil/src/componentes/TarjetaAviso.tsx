import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRef } from "react";
import { vibrarLigero } from "../utilidades/haptico";
import { Aviso, CategoriaAviso } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { useTema } from "../estado/useTema";
import { marca } from "../config/marca";
import { tiempoRelativo } from "../utilidades/tiempoRelativo";
import { useMeInteresa } from "../estado/useMeInteresa";
import { useComparticiones } from "../estado/useComparticiones";
import { VisorImagen } from "./VisorImagen";

export function estiloCategoria(
  colores: PaletaColores,
  oscuro: boolean
): Record<CategoriaAviso, { icono: keyof typeof Ionicons.glyphMap; fondo: string; texto: string; etiqueta: string }> {
  return {
    municipal: { icono: "business", fondo: colores.primarioSuave, texto: colores.primarioFuerte, etiqueta: "Municipal" },
    // Mostaza — mismo tono decorativo que OfertasPasillosNegocio.tsx, a propósito fuera de la marca.
    junta_vecinal: {
      icono: "people",
      fondo: oscuro ? "#3a3018" : "#f6ecd6",
      texto: oscuro ? "#e0b565" : "#b8862e",
      etiqueta: "Junta vecinal",
    },
    seguridad: {
      icono: "shield-checkmark",
      fondo: oscuro ? "#3a201c" : "#fbe2de",
      texto: colores.error,
      etiqueta: "Alerta",
    },
    otro: { icono: "megaphone", fondo: colores.superficieHundida, texto: colores.textoSuave, etiqueta: "Aviso" },
  };
}

export function TarjetaAviso({ aviso }: { aviso: Aviso }) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores);
  const estilo = estiloCategoria(colores, modo === "oscuro")[aviso.categoria];
  const marcado = useMeInteresa((estado) => estado.marcados.has(aviso.id));
  const alternar = useMeInteresa((estado) => estado.alternar);
  const meGusta = aviso.meGusta + (marcado ? 1 : 0);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const incrementoCompartidos = useComparticiones(
    (estado) => estado.incrementos[aviso.id] ?? 0
  );
  const registrarComparticion = useComparticiones((estado) => estado.registrar);
  const compartidos = aviso.compartidos + incrementoCompartidos;

  async function compartir() {
    try {
      const resultado = await Share.share({
        message: `${aviso.titulo}\n\n${aviso.cuerpo}\n\n— ${aviso.fuenteNombre}, vía ${marca.nombreApp}`,
      });
      if (resultado.action === Share.sharedAction) {
        registrarComparticion(aviso.id);
      }
    } catch {
      // El usuario canceló o la plataforma no soporta compartir nativo; no se suma al conteo.
    }
  }

  const esUrgente = aviso.categoria === "seguridad";
  const latido = useRef(new Animated.Value(1)).current;

  function tocarMeInteresa() {
    const activar = !marcado;
    alternar(aviso.id);
    if (activar) {
      vibrarLigero();
      latido.setValue(1);
      Animated.sequence([
        Animated.timing(latido, { toValue: 1.25, duration: 110, useNativeDriver: Platform.OS !== "web" }),
        Animated.spring(latido, { toValue: 1, friction: 4, tension: 180, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
    }
  }

  return (
    <View style={styles.post}>
      <View style={[styles.etiqueta, { backgroundColor: estilo.fondo }]}>
        <Text style={[styles.etiquetaTexto, { color: estilo.texto }]}>
          {esUrgente ? "Alerta de seguridad" : estilo.etiqueta}
        </Text>
      </View>

      <Text style={styles.titulo} accessibilityRole="header">
        {aviso.titulo}
      </Text>
      <Text style={styles.cuerpo}>{aviso.cuerpo}</Text>

      {aviso.imagenUrl ? (
        <Pressable onPress={() => setVisorAbierto(true)} accessibilityRole="imagebutton" accessibilityLabel="Ver foto del aviso">
          <Image source={{ uri: aviso.imagenUrl }} style={styles.imagen} contentFit="cover" transition={250} />
        </Pressable>
      ) : null}

      <View style={styles.autor}>
        <View style={[styles.avatar, { backgroundColor: estilo.fondo }]}>
          <Ionicons name={estilo.icono} size={13} color={estilo.texto} />
        </View>
        <Text style={styles.fuente} numberOfLines={1}>
          {aviso.fuenteNombre}
        </Text>
        {aviso.fuenteVerificada ? (
          <Ionicons name="checkmark-circle" size={13} color={colores.primario} accessibilityLabel="Fuente verificada" />
        ) : null}
        <Text style={styles.fecha}> · {tiempoRelativo(aviso.publicadoEn)}</Text>
      </View>

      <View style={styles.pie}>
        <Pressable
          style={styles.accion}
          onPress={tocarMeInteresa}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ selected: marcado }}
          accessibilityLabel={`Me interesa, ${meGusta}`}
        >
          <Animated.View style={{ transform: [{ scale: latido }] }}>
            <Ionicons name={marcado ? "heart" : "heart-outline"} size={18} color={marcado ? "#c8322e" : colores.textoSuave} />
          </Animated.View>
          <Text style={[styles.contador, marcado && { color: "#c8322e" }]}>{meGusta}</Text>
        </Pressable>
        <Pressable style={styles.accion} onPress={compartir} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Compartir, ${compartidos}`}>
          <Ionicons name="paper-plane-outline" size={17} color={colores.textoSuave} />
          <Text style={styles.contador}>{compartidos}</Text>
        </Pressable>
      </View>

      {aviso.imagenUrl ? (
        <VisorImagen visible={visorAbierto} uri={aviso.imagenUrl} onCerrar={() => setVisorAbierto(false)} />
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    post: {
      paddingVertical: espaciado.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colores.bordeFuerte,
      gap: espaciado.xs + 2,
    },
    etiqueta: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    etiquetaTexto: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 11.5 },
    titulo: { ...tipografia.subtitulo, fontSize: 17, lineHeight: 22, color: colores.texto, marginTop: 2 },
    cuerpo: { ...tipografia.cuerpo, color: colores.textoSuave },
    imagen: { width: "100%", height: 180, borderRadius: 10, marginTop: espaciado.xs, backgroundColor: colores.superficieHundida2 },
    autor: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: espaciado.xs },
    avatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    fuente: { ...tipografia.pie, fontFamily: "SchibstedGrotesk_600SemiBold", color: colores.texto, flexShrink: 1 },
    fecha: { ...tipografia.pie, color: colores.textoSuave },
    pie: { flexDirection: "row", gap: espaciado.lg, marginTop: espaciado.xs },
    accion: { flexDirection: "row", alignItems: "center", gap: 5 },
    contador: { ...tipografia.pie, fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 12.5, color: colores.textoSuave },
  });
}
