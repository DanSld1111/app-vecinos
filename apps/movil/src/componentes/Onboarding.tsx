import { useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { marca } from "../config/marca";
import { BotonPrimario } from "./BotonPrimario";
import { useOnboarding } from "../estado/useOnboarding";

const PASOS: { foto: ImageSourcePropType; titulo: string; texto: string }[] = [
  {
    foto: require("../../assets/servicios/restaurantes.jpg"),
    titulo: "Encuentra lo de tu comunidad",
    texto: "Negocios, restaurantes y servicios de tu comunidad, todo en un solo lugar.",
  },
  {
    foto: require("../../assets/servicios/guia-negocios.jpg"),
    titulo: "Entérate primero",
    texto: "Avisos de la junta vecinal y de la municipalidad, verificados antes de llegarte.",
  },
  {
    foto: require("../../assets/servicios/market-space.jpg"),
    titulo: "¿Tienes un negocio?",
    texto: "Entra en \"Modo gestión\" desde tu perfil para publicar tu ficha, fotos y ofertas.",
  },
];

/** Carrusel de 3 pasos, mostrado una sola vez tras el primer login (ver useOnboarding). */
export function Onboarding() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
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
    <View style={[styles.contenedor, { paddingTop: insets.top }]}>
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
            <Image source={p.foto} style={styles.foto} resizeMode="cover" accessibilityIgnoresInvertColors />
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
    pagina: { flex: 1, justifyContent: "flex-end", padding: espaciado.lg, paddingBottom: espaciado.md },
    foto: { flex: 1, width: "100%", borderRadius: 12, marginBottom: espaciado.xl, backgroundColor: colores.superficieHundida },
    titulo: { ...tipografia.titulo, fontSize: 28, lineHeight: 31, color: colores.texto, marginBottom: espaciado.sm },
    texto: { ...tipografia.cuerpo, fontSize: 15, lineHeight: 21, color: colores.textoSuave },
    pie: { padding: espaciado.lg, gap: espaciado.md, alignItems: "stretch" },
    puntos: { flexDirection: "row", gap: 4 },
    punto: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colores.superficieHundida2 },
    puntoActivo: { backgroundColor: colores.texto },
    omitir: { ...tipografia.cuerpoDestacado, fontSize: 13.5, color: colores.textoSuave, textAlign: "center" },
  });
}
