import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ImageBackground, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ServicioApp } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../../src/disenio";
import { useTema } from "../../../src/estado/useTema";
import { entorno } from "../../../src/config/entorno";
import { urlCompleta } from "../../../src/utilidades/media";
import { useComunidadActiva } from "../../../src/estado/comunidadActiva";
import { useNegocios } from "../../../src/datos/hooks/useNegocios";
import { useServiciosApp } from "../../../src/datos/hooks/useServiciosApp";
import { BarraBusqueda } from "../../../src/componentes/BarraBusqueda";
import { IconoServicio, SlugIconoServicio } from "../../../src/componentes/IconoServicio";

// A qué pantalla navega cada servicio — sigue fijo en el código a propósito: activar un
// servicio nuevo (ej. "Taxi") desde el panel solo cambia cómo se ve la tarjeta, todavía hace
// falta construir su pantalla real y agregarla acá. Ver
// docs/decisiones/0025-servicios-editables-desde-admin.md.
const RUTA_POR_SLUG: Partial<Record<string, "/servicios/negocios" | "/servicios/restaurantes" | "/servicios/productos" | "/servicios/supermarket">> = {
  negocios: "/servicios/negocios",
  restaurantes: "/servicios/restaurantes",
  "market-space": "/servicios/productos",
  supermarket: "/servicios/supermarket",
};

// En modo mock (sin servidor) se usan estas fotos ya empaquetadas en vez de una URL —
// ver el comentario en datos/mock/servicios.mock.ts.
const IMAGENES_LOCALES: Partial<Record<string, ImageSourcePropType>> = {
  negocios: require("../../../assets/servicios/guia-negocios.jpg"),
  restaurantes: require("../../../assets/servicios/restaurantes.jpg"),
  "market-space": require("../../../assets/servicios/market-space.jpg"),
  supermarket: require("../../../assets/servicios/supermarket.jpg"),
};

function colorIconoPorSlug(slug: string, colores: PaletaColores, oscuro: boolean): string {
  const mapa: Record<string, string> = {
    negocios: oscuro ? "#7fb4d9" : "#2f6690",
    restaurantes: colores.acentoFuerte,
    "market-space": oscuro ? "#e0b565" : "#b8862e",
    supermarket: colores.primarioFuerte,
  };
  return mapa[slug] ?? colores.primarioFuerte;
}

function fuenteImagen(servicio: ServicioApp): ImageSourcePropType | null {
  if (entorno.fuenteDeDatos === "mock") return IMAGENES_LOCALES[servicio.slug] ?? null;
  const url = urlCompleta(servicio.fotoUrl);
  return url ? { uri: url } : null;
}

export default function Servicios() {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores);
  const { data: servicios } = useServiciosApp();
  const { comunidad } = useComunidadActiva();
  const { data: negocios } = useNegocios({ comunidadId: comunidad?.id ?? "" });

  const disponibles = (servicios ?? [])
    .filter((s) => s.estado === "disponible")
    .sort((a, b) => a.orden - b.orden);
  const proximos = (servicios ?? [])
    .filter((s) => s.estado === "proximamente")
    .sort((a, b) => a.orden - b.orden);

  function alTocar(servicio: ServicioApp) {
    const ruta = RUTA_POR_SLUG[servicio.slug];
    if (ruta) router.push(ruta);
    // Si un servicio nuevo se marca "disponible" desde el panel antes de que exista su
    // pantalla real, tocar la tarjeta no navega a ningún lado — a propósito, ver comentario
    // de RUTA_POR_SLUG arriba.
  }

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido}>
      <Text style={styles.titulo}>Servicios</Text>
      <Text style={styles.subtitulo}>Todo lo que tu barrio ofrece, en un solo lugar.</Text>

      <BarraBusqueda placeholder="Buscar negocios, platos, productos…" onPress={() => router.push("/buscar")} />

      <Text style={styles.etiquetaSeccion}>Disponible ahora</Text>
      <View style={styles.grid}>
        {[0, 1].map((fila) => (
          <View key={fila} style={styles.filaGrid}>
            {disponibles.slice(fila * 2, fila * 2 + 2).map((servicio) => {
              const imagen = fuenteImagen(servicio);
              const colorIcono = colorIconoPorSlug(servicio.slug, colores, modo === "oscuro");
              const descripcion =
                servicio.slug === "negocios"
                  ? negocios
                    ? `${negocios.items.length} negocios en ${comunidad?.nombre ?? "tu zona"}`
                    : "Negocios verificados"
                  : servicio.descripcion;

              return (
                <Pressable
                  key={servicio.slug}
                  style={styles.tarjetaSombra}
                  onPress={() => alTocar(servicio)}
                >
                  {imagen ? (
                    <ImageBackground
                      source={imagen}
                      style={styles.tarjeta}
                      imageStyle={styles.tarjetaImagen}
                      resizeMode="cover"
                    >
                      <LinearGradient
                        // La foto se ve entera en el tercio de arriba; el oscurecido se concentra
                        // en el tercio de abajo, justo donde va el texto, para que no tape el resto.
                        colors={["rgba(8,10,8,0.05)", "rgba(8,10,8,0.18)", "rgba(8,10,8,0.88)"]}
                        locations={[0, 0.5, 1]}
                        style={styles.degradado}
                      />
                      <View style={styles.icono}>
                        <IconoServicio slug={servicio.slug as SlugIconoServicio} size={19} color={colorIcono} />
                      </View>
                      <View style={styles.tarjetaTextos}>
                        <Text style={styles.tarjetaNombre}>{servicio.nombre}</Text>
                        <View style={styles.filaDescripcion}>
                          <Text style={styles.tarjetaDescripcion} numberOfLines={1}>
                            {descripcion}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                        </View>
                      </View>
                    </ImageBackground>
                  ) : (
                    // Todavía sin foto subida desde el panel — misma tarjeta, sin degradado ni
                    // texto blanco (no hay foto oscura de fondo que lo justifique).
                    <View style={styles.tarjeta}>
                      <View style={[styles.icono, styles.iconoSinFoto]}>
                        <IconoServicio slug={servicio.slug as SlugIconoServicio} size={19} color={colorIcono} />
                      </View>
                      <View style={styles.tarjetaTextos}>
                        <Text style={styles.tarjetaNombreSinFoto}>{servicio.nombre}</Text>
                        <View style={styles.filaDescripcion}>
                          <Text style={styles.tarjetaDescripcionSinFoto} numberOfLines={1}>
                            {descripcion}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={colores.textoTenue} />
                        </View>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={styles.etiquetaSeccion}>Próximamente</Text>
      <View style={styles.gridProximamente}>
        {proximos.map((servicio) => (
          <View key={servicio.slug} style={styles.tarjetaProxima}>
            <View style={styles.iconoProximo}>
              <IconoServicio slug={servicio.slug as SlugIconoServicio} size={15} color={colores.textoSuave} />
            </View>
            <Text style={styles.textoProximo}>{servicio.nombre}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bannerSugerir}>
        <View style={styles.bannerIcono}>
          <IconoServicio slug="estrella" size={18} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitulo}>¿Qué servicio te gustaría ver aquí?</Text>
          <Text style={styles.bannerSubtitulo}>Cuéntanos qué le falta a tu barrio</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.superficieHundida,
    },
    contenido: {
      padding: espaciado.lg,
      gap: espaciado.md,
    },
    titulo: {
      ...tipografia.displayGrande,
      color: colores.texto,
    },
    subtitulo: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      marginTop: -espaciado.sm,
    },
    etiquetaSeccion: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
      marginTop: espaciado.xs,
    },
    grid: {
      gap: espaciado.sm,
    },
    filaGrid: {
      flexDirection: "row",
      gap: espaciado.sm,
    },
    tarjetaSombra: {
      flex: 1,
      borderRadius: radios.lg,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 2,
    },
    tarjeta: {
      flex: 1,
      borderRadius: radios.lg,
      overflow: "hidden",
      padding: espaciado.md,
      minHeight: 128,
      backgroundColor: colores.superficie,
      // Ícono arriba, nombre/descripción abajo — el degradado oscurece de arriba hacia abajo
      // para que el texto blanco se lea bien sobre cualquier foto de fondo.
      justifyContent: "space-between",
    },
    tarjetaImagen: {
      borderRadius: radios.lg,
      width: "100%",
      height: "100%",
    },
    degradado: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    icono: {
      width: 40,
      height: 40,
      borderRadius: radios.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.94)",
      alignSelf: "flex-start",
    },
    iconoSinFoto: {
      backgroundColor: colores.superficieHundida,
    },
    tarjetaTextos: {
      gap: 2,
    },
    tarjetaNombre: {
      ...tipografia.displaySeccion,
      fontSize: 15,
      color: "#ffffff",
    },
    tarjetaNombreSinFoto: {
      ...tipografia.displaySeccion,
      fontSize: 15,
      color: colores.texto,
    },
    filaDescripcion: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: espaciado.xs,
    },
    tarjetaDescripcion: {
      ...tipografia.pie,
      color: "rgba(255,255,255,0.85)",
      flexShrink: 1,
    },
    tarjetaDescripcionSinFoto: {
      ...tipografia.pie,
      color: colores.textoSuave,
      flexShrink: 1,
    },

    gridProximamente: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
    },
    tarjetaProxima: {
      width: "31%",
      backgroundColor: colores.superficie,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colores.borde,
      borderRadius: radios.md,
      paddingVertical: espaciado.sm,
      paddingHorizontal: 6,
      alignItems: "center",
      gap: 5,
      opacity: 0.8,
    },
    iconoProximo: {
      width: 32,
      height: 32,
      borderRadius: radios.sm,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
    textoProximo: {
      ...tipografia.pie,
      fontSize: 11,
      fontWeight: "700",
      color: colores.textoSuave,
      textAlign: "center",
    },

    bannerSugerir: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      backgroundColor: colores.primarioFuerte,
      borderRadius: radios.lg,
      padding: espaciado.md,
    },
    bannerIcono: {
      width: 38,
      height: 38,
      borderRadius: radios.md,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
    },
    bannerTitulo: {
      ...tipografia.displaySeccion,
      fontSize: 14.5,
      color: "#ffffff",
    },
    bannerSubtitulo: {
      ...tipografia.pie,
      color: "rgba(255,255,255,0.85)",
    },
  });
}
