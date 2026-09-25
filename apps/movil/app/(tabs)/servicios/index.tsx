import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ImageBackground, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ServicioApp } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../../src/disenio";
import { useTema } from "../../../src/estado/useTema";
import { entorno } from "../../../src/config/entorno";
import { urlCompleta } from "../../../src/utilidades/media";
import { useComunidadActiva } from "../../../src/estado/comunidadActiva";
import { useNegocios } from "../../../src/datos/hooks/useNegocios";
import { useServiciosApp } from "../../../src/datos/hooks/useServiciosApp";
import { repositorioServicios } from "../../../src/datos/fabricaRepositorios";
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

// Igual criterio que RUTA_POR_SLUG: fijo en el código, no algo que el panel pueda reordenar
// todavía. Un servicio "próximamente" que no esté en ningún grupo de abajo cae en el último
// ("Comunidad") — así uno nuevo siempre tiene dónde aparecer aunque nadie lo haya ubicado
// todavía. Ver docs/decisiones/0074-servicios-real.md.
const GRUPOS_PROXIMAMENTE: { titulo: string; slugs: string[] }[] = [
  { titulo: "Negocios y turismo", slugs: ["turismo", "inmobiliaria"] },
  { titulo: "Movilidad y trámites", slugs: ["taxi", "consultorias", "bolsa-empleo"] },
  { titulo: "Comunidad", slugs: ["rescate-animal", "bolsa-puntos", "otros"] },
];

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

/** "2 negocios" / "1 negocio" — para las tarjetas de rubro (Restaurantes, Market Space…). */
function textoConteo(cantidad: number): string {
  return cantidad === 1 ? "1 negocio" : `${cantidad} negocios`;
}

export default function Servicios() {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { data: servicios } = useServiciosApp();
  const { comunidad } = useComunidadActiva();
  const { data: negocios } = useNegocios({ comunidadId: comunidad?.id ?? "" });

  const todosDisponibles = (servicios ?? []).filter((s) => s.estado === "disponible");
  const servicioGuia = todosDisponibles.find((s) => s.slug === "negocios");
  // El resto de "disponible ahora", ordenados por uso real (aperturas de los últimos 7 días) —
  // mismo criterio que ya usa Inicio con "Cerca de ti" — y no por el campo `orden` fijo del
  // panel. Ver docs/decisiones/0074-servicios-real.md.
  const rubros = todosDisponibles
    .filter((s) => s.slug !== "negocios")
    .sort((a, b) => b.visitas7d - a.visitas7d || a.orden - b.orden);

  const proximos = (servicios ?? []).filter((s) => s.estado === "proximamente");
  const gruposProximamente = GRUPOS_PROXIMAMENTE.map((grupo) => ({
    titulo: grupo.titulo,
    items: proximos.filter((s) => grupo.slugs.includes(s.slug)),
  }));
  // Cualquier "próximamente" que no esté en ningún grupo (uno nuevo, recién activado desde el
  // panel) cae en el último grupo — nunca desaparece de la pantalla por no estar ubicado todavía.
  const slugsAgrupados = new Set(GRUPOS_PROXIMAMENTE.flatMap((g) => g.slugs));
  const sinGrupo = proximos.filter((s) => !slugsAgrupados.has(s.slug));
  if (sinGrupo.length > 0 && gruposProximamente.length > 0) {
    gruposProximamente[gruposProximamente.length - 1].items.push(...sinGrupo);
  }

  function alTocar(servicio: ServicioApp) {
    void repositorioServicios.registrarVisita(servicio.slug);
    const ruta = RUTA_POR_SLUG[servicio.slug];
    if (ruta) router.push(ruta);
    // Si un servicio nuevo se marca "disponible" desde el panel antes de que exista su
    // pantalla real, tocar la tarjeta no navega a ningún lado — a propósito, ver comentario
    // de RUTA_POR_SLUG arriba.
  }

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={[styles.contenido, { paddingTop: espaciado.lg + insets.top }]}>
      <Text style={styles.titulo}>Servicios</Text>
      <Text style={styles.subtitulo}>
        {todosDisponibles.length} de {(servicios ?? []).length} ya activos en {comunidad?.nombre ?? "tu distrito"}
      </Text>

      <BarraBusqueda placeholder="Buscar negocios, platos, productos…" onPress={() => router.push("/buscar")} />

      {servicioGuia ? (
        <Pressable style={styles.heroSombra} onPress={() => alTocar(servicioGuia)}>
          <LinearGradient colors={["#3a5f7d", "#213e54"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroIcono}>
              <IconoServicio slug="negocios" size={20} color="#ffffff" />
            </View>
            <Text style={styles.heroEtiqueta}>Busca en todo tu distrito</Text>
            <Text style={styles.heroNombre}>{servicioGuia.nombre}</Text>
            <View style={styles.heroFila}>
              <Text style={styles.heroDescripcion} numberOfLines={1}>
                {negocios ? `${negocios.items.length} negocios verificados en ${comunidad?.nombre ?? "tu zona"}` : "Negocios verificados"}
              </Text>
              <View style={styles.heroBoton}>
                <Text style={styles.heroBotonTexto}>Explorar →</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      ) : null}

      <Text style={styles.etiquetaSeccion}>Explora por rubro</Text>
      <View style={styles.filaGrid}>
        {rubros.map((servicio) => {
          const imagen = fuenteImagen(servicio);
          const colorIcono = colorIconoPorSlug(servicio.slug, colores, modo === "oscuro");

          return (
            <Pressable key={servicio.slug} style={styles.tarjetaSombra} onPress={() => alTocar(servicio)}>
              {imagen ? (
                <ImageBackground
                  source={imagen}
                  style={styles.tarjeta}
                  imageStyle={styles.tarjetaImagen}
                  resizeMode="cover"
                >
                  <LinearGradient
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
                        {textoConteo(servicio.negocios)}
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
                        {textoConteo(servicio.negocios)}
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

      <Text style={styles.etiquetaSeccion}>Próximamente</Text>
      {gruposProximamente
        .filter((grupo) => grupo.items.length > 0)
        .map((grupo) => (
          <View key={grupo.titulo} style={styles.grupoProximo}>
            <Text style={styles.tituloGrupo}>{grupo.titulo}</Text>
            <View style={styles.filaProximos}>
              {grupo.items.map((servicio) => (
                <View key={servicio.slug} style={styles.tarjetaProxima}>
                  <View style={styles.iconoProximo}>
                    <IconoServicio slug={servicio.slug as SlugIconoServicio} size={15} color={colores.textoSuave} />
                  </View>
                  <Text style={styles.textoProximo}>{servicio.nombre}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
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
      gap: espaciado.sm,
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

    heroSombra: {
      borderRadius: radios.lg,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 2,
    },
    hero: {
      borderRadius: radios.lg,
      padding: espaciado.md,
      gap: 2,
    },
    heroIcono: {
      width: 36,
      height: 36,
      borderRadius: radios.md,
      backgroundColor: "rgba(255,255,255,0.16)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    heroEtiqueta: {
      ...tipografia.etiqueta,
      fontSize: 10,
      color: "rgba(255,255,255,0.75)",
      textTransform: "uppercase",
    },
    heroNombre: {
      ...tipografia.displaySeccion,
      fontSize: 17,
      color: "#ffffff",
    },
    heroFila: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: espaciado.sm,
      marginTop: espaciado.xs,
    },
    heroDescripcion: {
      ...tipografia.pie,
      color: "rgba(255,255,255,0.85)",
      flexShrink: 1,
    },
    heroBoton: {
      backgroundColor: "rgba(255,255,255,0.18)",
      paddingHorizontal: espaciado.sm,
      paddingVertical: 5,
      borderRadius: radios.completo,
      flexShrink: 0,
    },
    heroBotonTexto: {
      ...tipografia.pie,
      fontSize: 10.5,
      fontFamily: "PlusJakartaSans_700Bold",
      color: "#ffffff",
    },

    filaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
    },
    tarjetaSombra: {
      flexBasis: "48%",
      flexGrow: 1,
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

    grupoProximo: {
      gap: espaciado.xs,
    },
    tituloGrupo: {
      ...tipografia.pie,
      fontSize: 11,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.textoSuave,
    },
    filaProximos: {
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
  });
}
