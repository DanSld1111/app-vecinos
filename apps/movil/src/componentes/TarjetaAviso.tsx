import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Aviso, CategoriaAviso } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
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

  return (
    <View style={esUrgente ? styles.sombraUrgente : styles.sombra}>
    <View style={styles.tarjeta}>
      <View style={styles.encabezado}>
        <View style={[styles.avatar, { backgroundColor: estilo.fondo }]}>
          <Ionicons name={estilo.icono} size={19} color={estilo.texto} />
        </View>
        <View style={styles.encabezadoTexto}>
          <View style={styles.filaFuente}>
            <Text style={styles.fuente} numberOfLines={1}>
              {aviso.fuenteNombre}
            </Text>
            {aviso.fuenteVerificada ? (
              <View style={styles.tick}>
                <Ionicons name="checkmark" size={9} color="#fff" />
              </View>
            ) : null}
          </View>
          <Text style={styles.fecha}>{tiempoRelativo(aviso.publicadoEn)}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: estilo.fondo }]}>
          <Text style={[styles.pillTexto, { color: estilo.texto }]}>{estilo.etiqueta}</Text>
        </View>
      </View>

      <View style={styles.cuerpoContenedor}>
        <Text style={styles.titulo}>{aviso.titulo}</Text>
        <Text style={styles.cuerpo}>{aviso.cuerpo}</Text>
      </View>

      {aviso.imagenUrl ? (
        <Pressable onPress={() => setVisorAbierto(true)}>
          <Image source={{ uri: aviso.imagenUrl }} style={styles.imagen} resizeMode="cover" />
        </Pressable>
      ) : null}

      <View style={styles.pie}>
        <Pressable style={styles.accion} onPress={() => alternar(aviso.id)} hitSlop={8}>
          <Ionicons
            name={marcado ? "heart" : "heart-outline"}
            size={20}
            color={marcado ? colores.acentoFuerte : colores.textoSuave}
          />
          <Text style={[styles.contador, marcado && styles.contadorActivo]}>{meGusta}</Text>
        </Pressable>
        <Pressable style={styles.accion} onPress={compartir} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={19} color={colores.textoSuave} />
          <Text style={styles.contador}>{compartidos}</Text>
        </Pressable>
      </View>

      <VisorImagen uri={aviso.imagenUrl} visible={visorAbierto} onCerrar={() => setVisorAbierto(false)} />
    </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    sombra: {
      borderRadius: radios.lg,
      backgroundColor: colores.superficie,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 3,
    },
    sombraUrgente: {
      borderRadius: radios.lg,
      backgroundColor: colores.superficie,
      shadowColor: colores.error,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 3,
    },
    tarjeta: {
      borderRadius: radios.lg,
      overflow: "hidden",
    },
    encabezado: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: espaciado.sm,
      padding: espaciado.md,
      paddingBottom: espaciado.sm,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: radios.md,
      alignItems: "center",
      justifyContent: "center",
    },
    encabezadoTexto: {
      flex: 1,
      gap: 1,
    },
    filaFuente: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    fuente: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
      flexShrink: 1,
    },
    tick: {
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: colores.primario,
      alignItems: "center",
      justifyContent: "center",
    },
    fecha: {
      ...tipografia.pie,
      fontSize: 11,
      color: colores.textoTenue,
    },
    pill: {
      paddingHorizontal: espaciado.sm,
      paddingVertical: 4,
      borderRadius: radios.completo,
    },
    pillTexto: {
      ...tipografia.etiqueta,
      fontSize: 10,
    },
    cuerpoContenedor: {
      paddingHorizontal: espaciado.md,
      paddingBottom: espaciado.md,
      gap: 2,
    },
    titulo: {
      ...tipografia.displaySeccion,
      fontSize: 16,
      color: colores.texto,
    },
    cuerpo: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
    },
    imagen: {
      width: "100%",
      aspectRatio: 16 / 10,
      backgroundColor: colores.superficieHundida,
    },
    pie: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.lg,
      borderTopWidth: 1,
      borderTopColor: colores.borde,
      paddingHorizontal: espaciado.md,
      paddingVertical: espaciado.sm,
    },
    accion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    contador: {
      ...tipografia.pie,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.textoSuave,
    },
    contadorActivo: {
      color: colores.acentoFuerte,
    },
  });
}
