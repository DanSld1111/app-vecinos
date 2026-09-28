import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../src/disenio";
import { useComunidadActiva } from "../src/estado/comunidadActiva";
import { useNegocios } from "../src/datos/hooks/useNegocios";
import { useCategorias } from "../src/datos/hooks/useCategorias";
import { useBusquedasRecientes } from "../src/estado/useBusquedasRecientes";
import { TarjetaNegocio } from "../src/componentes/TarjetaNegocio";
import { EstadoVacio } from "../src/componentes/EstadoVacio";
import { FotoNegocio } from "../src/componentes/FotoNegocio";
import { SinFoto } from "../src/componentes/SinFoto";
import { useAnuncios } from "../src/datos/hooks/useAnuncios";
import { recolectarOfertas } from "../src/utilidades/ofertas";
import { urlCompleta } from "../src/utilidades/media";

const TENDENCIAS: { termino: string; categoria: string }[] = [
  { termino: "veterinaria", categoria: "Mascotas" },
  { termino: "pollería", categoria: "Restaurantes" },
  { termino: "ferretería", categoria: "Hogar" },
  { termino: "tejidos", categoria: "Moda" },
];

export default function BuscarPantallaCompleta() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { comunidad } = useComunidadActiva();
  const [texto, setTexto] = useState("");
  const [tendenciasExpandidas, setTendenciasExpandidas] = useState(false);
  const { recientes, agregar, quitar, limpiar } = useBusquedasRecientes();
  const { data: categorias } = useCategorias();

  const { data: negociosBuscados, isLoading } = useNegocios({
    comunidadId: comunidad?.id ?? "",
    busqueda: texto.trim() || undefined,
    limite: 20,
  });

  const { data: negociosComunidad } = useNegocios({
    comunidadId: comunidad?.id ?? "",
    limite: 30,
  });

  const ofertas = useMemo(
    () => recolectarOfertas(negociosComunidad?.items ?? []),
    [negociosComunidad]
  );

  const { data: anunciosData } = useAnuncios();
  const anuncio = anunciosData?.find((a) => a.ubicaciones.includes("banner_buscar"));

  function buscar(termino: string) {
    setTexto(termino);
    agregar(termino);
  }

  function alEnviar() {
    if (texto.trim()) agregar(texto);
  }

  function infoReciente(termino: string) {
    const negocio = negociosComunidad?.items.find(
      (n) => n.nombre.toLowerCase() === termino.toLowerCase()
    );
    if (!negocio) {
      return { icono: "time-outline" as const, etiqueta: "Búsqueda reciente" };
    }
    const categoria = categorias?.find((c) => c.id === negocio.categoriaIds[0]);
    return { icono: "storefront-outline" as const, etiqueta: categoria?.nombre ?? "Negocio" };
  }

  const mostrandoResultados = texto.trim().length > 0;
  const tendenciasVisibles = tendenciasExpandidas ? TENDENCIAS : TENDENCIAS.slice(0, 3);

  return (
    <View style={styles.contenedor}>
      <View style={[styles.header, { paddingTop: espaciado.sm + insets.top }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        >
          <Ionicons name="chevron-back" size={24} color={colores.texto} />
        </Pressable>
        <View style={styles.inputFila}>
          <Ionicons name="search" size={16} color={colores.textoSuave} />
          <TextInput
            autoFocus
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={alEnviar}
            placeholder="Negocios, platos y productos"
            placeholderTextColor={colores.textoTenue}
            style={styles.input}
            returnKeyType="search"
          />
        </View>
      </View>

      {mostrandoResultados ? (
        <FlatList
          data={negociosBuscados?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contenido}
          ListEmptyComponent={
            !isLoading ? <EstadoVacio titulo="No encontramos negocios con ese nombre." /> : null
          }
          renderItem={({ item }) => (
            <TarjetaNegocio
              negocio={item}
              onPress={() => {
                agregar(texto);
                router.push(`/negocio/${item.id}`);
              }}
            />
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.contenido}>
          {recientes.length > 0 ? (
            <View style={styles.seccion}>
              <View style={styles.filaEncabezado}>
                <Text style={styles.tituloSeccion}>Tus últimas búsquedas</Text>
                <Pressable onPress={limpiar}>
                  <Text style={styles.limpiar}>Limpiar</Text>
                </Pressable>
              </View>
              {recientes.map((termino) => {
                const info = infoReciente(termino);
                return (
                  <Pressable key={termino} style={styles.filaReciente} onPress={() => buscar(termino)}>
                    <View style={styles.iconoReciente}>
                      <Ionicons name={info.icono} size={16} color={colores.textoSuave} />
                    </View>
                    <View style={styles.infoReciente}>
                      <Text style={styles.nombreReciente} numberOfLines={1}>
                        {termino}
                      </Text>
                      <Text style={styles.categoriaReciente}>{info.etiqueta}</Text>
                    </View>
                    <Pressable hitSlop={8} onPress={() => quitar(termino)}>
                      <Ionicons name="close" size={16} color={colores.textoTenue} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {ofertas.length > 0 ? (
            <View style={styles.bannerOfertas}>
              <Text style={styles.ofertasTitulo}>Ofertas de tus negocios de siempre</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaOfertas}>
                {ofertas.map(({ negocioId, negocioNombre, negocioFotoUrl, oferta, moneda }) => (
                  <Pressable
                    key={`${negocioId}-${oferta.nombre}`}
                    style={styles.tarjetaOferta}
                    onPress={() => router.push(`/negocio/${negocioId}`)}
                  >
                    <FotoNegocio nombre={negocioNombre} url={negocioFotoUrl} style={styles.fotoOferta} tamanoIniciales={24} />
                    <Text style={styles.cintaOferta}>{oferta.etiqueta}</Text>
                    <View style={styles.infoOferta}>
                      <Text style={styles.negocioOferta} numberOfLines={1}>
                        {negocioNombre}
                      </Text>
                      <Text style={styles.nombreOferta} numberOfLines={1}>
                        {oferta.nombre}
                      </Text>
                      {oferta.precioOriginal ? (
                        <Text style={styles.precioAntesOferta}>{formatearPrecio(oferta.precioOriginal, moneda)}</Text>
                      ) : null}
                      <Text style={styles.precioOferta}>{formatearPrecio(oferta.precio, moneda)}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {negociosComunidad && negociosComunidad.items.length > 0 ? (
            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Negocios más visitados</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: espaciado.sm }}>
                {negociosComunidad.items.slice(0, 8).map((negocio) => (
                  <Pressable
                    key={negocio.id}
                    style={styles.visitado}
                    onPress={() => router.push(`/negocio/${negocio.id}`)}
                  >
                    <FotoNegocio nombre={negocio.nombre} url={negocio.fotoPrincipalUrl} style={styles.fotoVisitado} tamanoIniciales={18} />
                    <Text style={styles.nombreVisitado} numberOfLines={2}>
                      {negocio.nombre}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {anuncio ? (
            <Pressable
              style={styles.bannerAnuncio}
              disabled={!anuncio.negocioId}
              onPress={() => anuncio.negocioId && router.push(`/negocio/${anuncio.negocioId}`)}
            >
              {anuncio.imagenUrl ? (
                <Image source={{ uri: anuncio.imagenUrl }} style={styles.anuncioFoto} />
              ) : (
                <View style={styles.anuncioIcono}>
                  <Ionicons name="star" size={18} color={colores.primarioFuerte} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.anuncioNombre} numberOfLines={1}>
                  {anuncio.nombre}
                </Text>
                <Text style={styles.anuncioDetalle} numberOfLines={1}>
                  {anuncio.detalle}
                </Text>
              </View>
              {anuncio.negocioId ? <Ionicons name="chevron-forward" size={16} color={colores.textoTenue} /> : null}
            </Pressable>
          ) : null}

          <View style={styles.seccion}>
            <Text style={styles.tituloSeccion}>Búsquedas que son tendencia</Text>
            {tendenciasVisibles.map((item, i) => (
              <Pressable key={item.termino} style={styles.filaTendencia} onPress={() => buscar(item.termino)}>
                <View style={styles.numeroTendencia}>
                  <Text style={styles.numeroTendenciaTexto}>{i + 1}</Text>
                </View>
                <View>
                  <Text style={styles.nombreTendencia}>{item.termino}</Text>
                  <Text style={styles.categoriaReciente}>{item.categoria}</Text>
                </View>
              </Pressable>
            ))}
            {TENDENCIAS.length > 3 ? (
              <Pressable onPress={() => setTendenciasExpandidas((v) => !v)}>
                <Text style={styles.mostrarMas}>
                  {tendenciasExpandidas ? "Mostrar menos" : "Mostrar más búsquedas"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      paddingHorizontal: espaciado.md,
      paddingTop: espaciado.sm,
      paddingBottom: espaciado.sm,
    },
    backBtn: {
      width: 36,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    inputFila: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.fondo,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colores.texto,
      paddingHorizontal: espaciado.md,
      height: 44,
    },
    input: {
      flex: 1,
      ...tipografia.cuerpo,
      color: colores.texto,
      ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
    },
    contenido: {
      padding: espaciado.lg,
      paddingTop: espaciado.xs,
      gap: espaciado.lg,
    },
    seccion: {
      gap: 2,
    },
    filaEncabezado: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: espaciado.xs,
    },
    tituloSeccion: {
      ...tipografia.subtitulo,
      color: colores.texto,
    },
    limpiar: {
      ...tipografia.pie,
      color: colores.primarioFuerte,
      fontWeight: "700",
    },
    filaReciente: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      paddingVertical: espaciado.xs,
    },
    iconoReciente: {
      width: 36,
      height: 36,
      borderRadius: radios.md,
      borderWidth: 1.5,
      borderColor: colores.borde,
      alignItems: "center",
      justifyContent: "center",
    },
    infoReciente: {
      flex: 1,
    },
    nombreReciente: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
    },
    categoriaReciente: {
      ...tipografia.pie,
      fontSize: 11,
      color: colores.textoTenue,
      fontWeight: "600",
    },

    bannerOfertas: {},
    ofertasEyebrow: {
      ...tipografia.etiqueta,
      fontSize: 10.5,
      color: "rgba(255,255,255,0.8)",
      textTransform: "uppercase",
    },
    ofertasTitulo: {
      ...tipografia.subtitulo,
      color: colores.texto,
      marginBottom: espaciado.sm,
    },
    filaOfertas: {
      marginHorizontal: -espaciado.lg,
      paddingHorizontal: espaciado.lg,
    },
    tarjetaOferta: {
      width: 150,
      marginRight: espaciado.sm + 2,
      backgroundColor: colores.fondo,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colores.borde,
      overflow: "hidden",
    },
    fotoOferta: {
      width: "100%",
      height: 96,
    },
    cintaOferta: {
      ...tipografia.pie,
      fontSize: 10,
      fontWeight: "800",
      color: "#ffffff",
      backgroundColor: colores.acentoFuerte,
      position: "absolute",
      top: 6,
      left: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 4,
      overflow: "hidden",
    },
    infoOferta: {
      padding: espaciado.sm,
      gap: 1,
    },
    negocioOferta: {
      ...tipografia.pie,
      fontSize: 11,
      color: colores.textoSuave,
    },
    nombreOferta: {
      ...tipografia.pie,
      fontWeight: "700",
      color: colores.texto,
      marginBottom: 1,
    },
    precioAntesOferta: {
      ...tipografia.pie,
      fontSize: 10.5,
      color: colores.textoTenue,
      textDecorationLine: "line-through",
    },
    precioOferta: {
      ...tipografia.cuerpoDestacado,
      fontFamily: "SchibstedGrotesk_700Bold",
      fontSize: 13.5,
      color: colores.texto,
    },

    visitado: {
      width: 68,
      alignItems: "center",
      gap: 6,
      marginRight: espaciado.md,
    },
    fotoVisitado: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    nombreVisitado: {
      ...tipografia.pie,
      fontSize: 11.5,
      fontFamily: "SchibstedGrotesk_600SemiBold",
      color: colores.texto,
      textAlign: "center",
    },

    bannerAnuncio: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      backgroundColor: colores.superficieHundida,
      borderRadius: 10,
      padding: espaciado.sm + 2,
    },
    anuncioIcono: {
      width: 52,
      height: 52,
      borderRadius: radios.md,
      backgroundColor: colores.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    anuncioFoto: {
      width: 52,
      height: 52,
      borderRadius: 8,
    },
    anuncioNombre: {
      ...tipografia.displaySeccion,
      fontSize: 14,
      color: colores.texto,
    },
    anuncioDetalle: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    anuncioCta: {
      flexShrink: 0,
      backgroundColor: colores.primario,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radios.completo,
    },
    anuncioCtaTexto: {
      ...tipografia.pie,
      fontSize: 11,
      fontFamily: "SchibstedGrotesk_700Bold",
      color: "#ffffff",
    },

    filaTendencia: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      paddingVertical: espaciado.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colores.bordeFuerte,
    },
    numeroTendencia: {
      width: 18,
    },
    numeroTendenciaTexto: {
      fontFamily: "SchibstedGrotesk_800ExtraBold",
      fontSize: 16,
      color: colores.textoTenue,
    },
    nombreTendencia: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
      textTransform: "capitalize",
    },
    mostrarMas: {
      ...tipografia.cuerpoDestacado,
      fontSize: 13,
      color: colores.primario,
      marginTop: espaciado.sm,
    },
  });
}
