import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { Anuncio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { useAnuncios } from "../datos/hooks/useAnuncios";

// Tiempo entre anuncios. Edítalo aquí para cambiar la velocidad de rotación.
const INTERVALO_MS = 6000;

const ANCHO_PANTALLA = Dimensions.get("window").width;
// Igual que CarruselAvisos: deja un espacio visible entre un anuncio y el siguiente en vez de
// que se vean pegados al asomar durante el desplazamiento.
const ESPACIO_ENTRE_TARJETAS = espaciado.sm;
const ANCHO_TARJETA = ANCHO_PANTALLA - espaciado.lg * 2 - ESPACIO_ENTRE_TARJETAS;
const INTERVALO_TOTAL = ANCHO_TARJETA + ESPACIO_ENTRE_TARJETAS;
const ALTO_TARJETA = 96;

function alTocarAnuncio(anuncio: Anuncio) {
  if (anuncio.negocioId) router.push(`/negocio/${anuncio.negocioId}`);
}

export function CarruselPublicidad() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const { data } = useAnuncios();
  const anuncios = (data ?? []).filter((a) => a.ubicaciones.includes("carrusel_inicio"));
  const [indice, setIndice] = useState(0);
  const listaRef = useRef<FlashListRef<Anuncio>>(null);

  useEffect(() => {
    if (anuncios.length < 2) return;
    const temporizador = setInterval(() => {
      setIndice((actual) => {
        const siguiente = (actual + 1) % anuncios.length;
        listaRef.current?.scrollToIndex({ index: siguiente, animated: true });
        return siguiente;
      });
    }, INTERVALO_MS);
    return () => clearInterval(temporizador);
  }, [anuncios.length]);

  function alDesplazar(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    const nuevoIndice = Math.round(evento.nativeEvent.contentOffset.x / INTERVALO_TOTAL);
    if (nuevoIndice !== indice) setIndice(nuevoIndice);
  }

  if (anuncios.length === 0) return null;

  return (
    <View>
      <View style={{ height: ALTO_TARJETA }}>
        <FlashList
          ref={listaRef}
          horizontal
          snapToInterval={INTERVALO_TOTAL}
          decelerationRate="fast"
          data={anuncios}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          onScroll={alDesplazar}
          scrollEventThrottle={16}
          renderItem={({ item }) =>
            item.imagenUrl ? (
              <Pressable
                style={[styles.tarjetaSombra, { width: ANCHO_TARJETA, marginRight: ESPACIO_ENTRE_TARJETAS }]}
                onPress={() => alTocarAnuncio(item)}
              >
                <ImageBackground
                  source={{ uri: item.imagenUrl }}
                  style={styles.tarjeta}
                  imageStyle={styles.tarjetaImagen}
                  resizeMode="cover"
                >
                  <LinearGradient
                    // Igual que las tarjetas de Servicios: la foto se ve entera arriba, el
                    // oscurecido se concentra abajo, justo donde va el texto.
                    colors={["rgba(8,10,8,0.05)", "rgba(8,10,8,0.2)", "rgba(8,10,8,0.85)"]}
                    locations={[0, 0.5, 1]}
                    style={styles.degradado}
                  />
                  <View style={styles.filaTexto}>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={styles.nombre} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <Text style={styles.detalle} numberOfLines={1}>
                        {item.detalle}
                      </Text>
                    </View>
                    {item.negocioId ? (
                      <View style={styles.cta}>
                        <Text style={styles.ctaTexto}>Ver</Text>
                      </View>
                    ) : null}
                  </View>
                </ImageBackground>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.tarjetaSombra,
                  styles.tarjeta,
                  styles.tarjetaSinFoto,
                  { width: ANCHO_TARJETA, marginRight: ESPACIO_ENTRE_TARJETAS },
                ]}
                onPress={() => alTocarAnuncio(item)}
              >
                <View style={styles.filaTexto}>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={[styles.nombre, { color: colores.texto }]} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    <Text style={[styles.detalle, { color: colores.textoSuave }]} numberOfLines={1}>
                      {item.detalle}
                    </Text>
                  </View>
                  {item.negocioId ? (
                    <View style={styles.cta}>
                      <Text style={styles.ctaTexto}>Ver</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            )
          }
        />
      </View>
      <View style={styles.puntos}>
        {anuncios.map((anuncio, i) => (
          <View key={anuncio.id} style={[styles.punto, i === indice && styles.puntoActivo]} />
        ))}
      </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjetaSombra: {
      borderRadius: radios.lg,
      overflow: "hidden",
    },
    tarjeta: {
      height: ALTO_TARJETA,
      justifyContent: "flex-end",
    },
    tarjetaImagen: {
      width: "100%",
      height: "100%",
    },
    tarjetaSinFoto: {
      backgroundColor: colores.primarioSuave,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    degradado: {
      ...StyleSheet.absoluteFillObject,
    },
    filaTexto: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: espaciado.sm,
      padding: espaciado.md,
    },
    nombre: {
      ...tipografia.cuerpoDestacado,
      fontSize: 14.5,
      color: "#ffffff",
    },
    detalle: {
      ...tipografia.pie,
      fontSize: 11.5,
      color: "rgba(255,255,255,0.85)",
    },
    cta: {
      flexShrink: 0,
      alignSelf: "flex-end",
      backgroundColor: colores.acentoFuerte,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radios.completo,
    },
    ctaTexto: {
      ...tipografia.pie,
      fontSize: 11,
      fontFamily: "PlusJakartaSans_700Bold",
      color: "#ffffff",
    },
    puntos: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 5,
      marginTop: espaciado.xs,
    },
    punto: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colores.borde,
    },
    puntoActivo: {
      backgroundColor: colores.acento,
      width: 16,
    },
  });
}
