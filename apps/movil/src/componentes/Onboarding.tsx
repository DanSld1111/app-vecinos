import { useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { marca } from "../config/marca";
import { BotonPrimario } from "./BotonPrimario";
import { useOnboarding } from "../estado/useOnboarding";

const PASOS: { icono: keyof typeof Ionicons.glyphMap; titulo: string; texto: string }[] = [
  {
    icono: "search",
    titulo: "Encuentra lo de tu barrio",
    texto: "Negocios, restaurantes y servicios de tu comunidad, todo en un solo lugar.",
  },
  {
    icono: "megaphone-outline",
    titulo: "Entérate primero",
    texto: "Avisos de la junta vecinal y de la municipalidad, verificados antes de llegarte.",
  },
  {
    icono: "storefront-outline",
    titulo: "¿Tienes un negocio?",
    texto: "Entra en \"Modo gestión\" desde tu perfil para publicar tu ficha, fotos y ofertas.",
  },
];

/** Carrusel de 3 pasos, mostrado una sola vez tras el primer login (ver useOnboarding). */
export function Onboarding() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const { width } = useWindowDimensions();
  const marcarVisto = useOnboarding((estado) => estado.marcarVisto);
  const [paso, setPaso] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Solo para el swipe manual (mueve el punto activo) — el botón "Siguiente" nunca depende de
  // este evento: en web, un scrollTo() programático no siempre dispara onMomentumScrollEnd,
  // así que esperar a ese evento dejaba el botón sin avanzar la página.
  function alDesplazar(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    const indice = Math.round(evento.nativeEvent.contentOffset.x / width);
    if (indice !== paso) setPaso(indice);
  }

  function siguiente() {
    if (paso < PASOS.length - 1) {
      const proximoPaso = paso + 1;
      setPaso(proximoPaso);
      scrollRef.current?.scrollTo({ x: proximoPaso * width, animated: true });
    } else {
      marcarVisto();
    }
  }

  return (
    <View style={styles.contenedor}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={alDesplazar}
        style={{ flex: 1 }}
      >
        {PASOS.map((p, i) => (
          <View key={i} style={[styles.pagina, { width }]}>
            <View style={styles.circuloIcono}>
              <Ionicons name={p.icono} size={40} color={colores.primario} />
            </View>
            <Text style={styles.titulo}>{p.titulo}</Text>
            <Text style={styles.texto}>{p.texto}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pie}>
        <View style={styles.puntos}>
          {PASOS.map((_, i) => (
            <View key={i} style={[styles.punto, i === paso && styles.puntoActivo]} />
          ))}
        </View>
        <BotonPrimario
          texto={paso === PASOS.length - 1 ? `Empezar a usar ${marca.nombreApp}` : "Siguiente"}
          onPress={siguiente}
        />
        {paso < PASOS.length - 1 ? (
          <Text style={styles.omitir} onPress={marcarVisto}>
            Omitir
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    pagina: { flex: 1, alignItems: "center", justifyContent: "center", padding: espaciado.xl },
    circuloIcono: {
      width: 88,
      height: 88,
      borderRadius: radios.completo,
      backgroundColor: colores.primarioSuave,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: espaciado.lg,
    },
    titulo: { ...tipografia.titulo, color: colores.texto, textAlign: "center", marginBottom: espaciado.sm },
    texto: { ...tipografia.cuerpo, color: colores.textoSuave, textAlign: "center" },
    pie: { padding: espaciado.lg, gap: espaciado.md, alignItems: "center" },
    puntos: { flexDirection: "row", gap: espaciado.xs },
    punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.superficieHundida2 },
    puntoActivo: { backgroundColor: colores.primario, width: 20 },
    omitir: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.textoTenue },
  });
}
