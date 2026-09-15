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
} from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../src/disenio";
import { useComunidadActiva } from "../src/estado/comunidadActiva";
import { useNegocios } from "../src/datos/hooks/useNegocios";
import { useCategorias } from "../src/datos/hooks/useCategorias";
import { useBusquedasRecientes } from "../src/estado/useBusquedasRecientes";
import { TarjetaNegocio } from "../src/componentes/TarjetaNegocio";
import { EstadoVacio } from "../src/componentes/EstadoVacio";
import { AvatarNegocio } from "../src/componentes/AvatarNegocio";
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

function formatearPrecio(precio: number) {
  return `S/ ${precio % 1 === 0 ? precio.toFixed(0) : precio.toFixed(2)}`;
}

export default function BuscarPantallaCompleta() {
  const colores = useColores();
  const styles = crearEstilos(colores);
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
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colores.texto} />
        </Pressable>
        <View style={styles.inputFila}>
          <Ionicons name="search" size={16} color={colores.textoTenue} />
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
              <Text style={styles.ofertasEyebrow}>Solo para ti</Text>
              <Text style={styles.ofertasTitulo}>Ofertas de tus negocios de siempre</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaOfertas}>
                {ofertas.map(({ negocioId, negocioNombre, negocioFotoUrl, oferta }) => (
                  <Pressable
                    key={`${negocioId}-${oferta.nombre}`}
                    style={styles.tarjetaOferta}
                    onPress={() => router.push(`/negocio/${negocioId}`)}
                  >
                    {negocioFotoUrl ? (
                      <Image source={{ uri: urlCompleta(negocioFotoUrl) }} style={styles.fotoOferta} />
                    ) : (
                      <SinFoto icono="pricetag-outline" tamanoIcono={20} style={styles.fotoOferta} />
                    )}
                    <Text style={styles.cintaOferta}>{oferta.etiqueta}</Text>
                    <View style={styles.infoOferta}>
                      <Text style={styles.negocioOferta} numberOfLines={1}>
                        {negocioNombre}
                      </Text>
                      <Text style={styles.nombreOferta} numberOfLines={1}>
                        {oferta.nombre}
                      </Text>
                      {oferta.precioOriginal ? (
                        <Text style={styles.precioAntesOferta}>{formatearPrecio(oferta.precioOriginal)}</Text>
                      ) : null}
                      <Text style={styles.precioOferta}>{formatearPrecio(oferta.precio)}</Text>
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
                    {negocio.fotoPrincipalUrl ? (
                      <Image source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.fotoVisitado} />
                    ) : (
                      <AvatarNegocio nombre={negocio.nombre} size={56} />
                    )}
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
              {anuncio.negocioId ? (
                <View style={styles.anuncioCta}>
                  <Text style={styles.anuncioCtaTexto}>Ver</Text>
                </View>
              ) : null}
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
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
    inputFila: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.superficie,
      borderRadius: radios.completo,
      paddingHorizontal: espaciado.md,
      height: 44,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    input: {
      flex: 1,
      ...tipografia.cuerpo,
      color: colores.texto,
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
      ...tipografia.displaySeccion,
      fontSize: 15,
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

    bannerOfertas: {
      backgroundColor: colores.primario,
      borderRadius: radios.lg,
      padding: espaciado.md,
    },
    ofertasEyebrow: {
      ...tipografia.etiqueta,
      fontSize: 10.5,
      color: "rgba(255,255,255,0.8)",
      textTransform: "uppercase",
    },
    ofertasTitulo: {
      ...tipografia.displaySeccion,
      fontSize: 17,
      color: "#ffffff",
      marginTop: 2,
      marginBottom: espaciado.md,
    },
    filaOfertas: {
      marginHorizontal: -espaciado.md,
      paddingHorizontal: espaciado.md,
    },
    tarjetaOferta: {
      width: 122,
      marginRight: espaciado.sm,
      backgroundColor: colores.superficie,
      borderRadius: radios.md,
      overflow: "hidden",
    },
    fotoOferta: {
      width: "100%",
      height: 78,
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
      borderRadius: radios.sm,
    },
    infoOferta: {
      padding: espaciado.sm,
      gap: 1,
    },
    negocioOferta: {
      ...tipografia.pie,
      fontSize: 9.5,
      fontWeight: "800",
      color: colores.primarioFuerte,
      textTransform: "uppercase",
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
      fontSize: 13,
      color: colores.primarioFuerte,
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
      fontSize: 10.5,
      fontWeight: "700",
      color: colores.textoSuave,
      textAlign: "center",
    },

    bannerAnuncio: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.lg,
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
      borderRadius: radios.md,
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
      fontFamily: "PlusJakartaSans_700Bold",
      color: "#ffffff",
    },

    filaTendencia: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      paddingVertical: espaciado.xs + 2,
    },
    numeroTendencia: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colores.texto,
      alignItems: "center",
      justifyContent: "center",
    },
    numeroTendenciaTexto: {
      ...tipografia.pie,
      fontWeight: "800",
      color: "#ffffff",
    },
    nombreTendencia: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
      textTransform: "capitalize",
    },
    mostrarMas: {
      ...tipografia.pie,
      fontWeight: "800",
      color: colores.primarioFuerte,
      textAlign: "center",
      marginTop: espaciado.xs,
    },
  });
}
