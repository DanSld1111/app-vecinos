import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { Negocio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { textos } from "../i18n/es";
import { useComunidadActiva } from "../estado/comunidadActiva";
import { useCategorias } from "../datos/hooks/useCategorias";
import { useNegocios } from "../datos/hooks/useNegocios";
import { ChipCategoria } from "./ChipCategoria";
import { abrirNegocio } from "./transicion/abrirNegocio";
import { TarjetaNegocio } from "./TarjetaNegocio";
import { TarjetaNegocioMenu } from "./TarjetaNegocioMenu";
import { TarjetaNegocioCatalogo } from "./TarjetaNegocioCatalogo";
import { EntradaAnimada } from "./EntradaAnimada";
import { EstadoVacio } from "./EstadoVacio";
import { EstadoError } from "./EstadoError";
import { EsqueletoListaNegocios } from "./EsqueletoNegocio";

/** Cuánto esperar sin que la persona escriba antes de volver a pedir — cada tecla antes disparaba
 * un refetch propio (queryKey distinto por caracter). */
const RETRASO_BUSQUEDA_MS = 350;

/** A qué plantilla de tarjeta corresponde cada servicio — mismo criterio que el arquetipo de la
 * ficha (menu/catalogo/…), esta vez para la tarjeta del listado. Ver
 * docs/decisiones/0072-servicio-dueno-de-categoria.md. */
const PLANTILLA_POR_SERVICIO: Record<string, "menu" | "catalogo"> = {
  restaurantes: "menu",
  "market-space": "catalogo",
  turismo: "catalogo",
  inmobiliaria: "catalogo",
};

export function GuiaListado({
  servicioSlugFijo,
  categoriaIdInicial,
  mostrarFiltroCategorias = false,
  titulo,
  subtitulo,
  placeholderBusqueda,
}: {
  /** Pantalla de un servicio (Restaurantes, Market Space…) — trae los negocios de TODAS sus
   * categorías, ya no una sola categoría "quemada" en el código de cada pantalla. Ver
   * docs/decisiones/0072-servicio-dueno-de-categoria.md. */
  servicioSlugFijo?: string;
  /** Solo para Guía de negocios (el buscador general): arranca en esa categoría si viene por
   * parámetro (ej. desde "Ver más" de una categoría en Inicio), pero sigue editable con los chips
   * — a diferencia de servicioSlugFijo, que es un tope fijo de la pantalla. */
  categoriaIdInicial?: string;
  mostrarFiltroCategorias?: boolean;
  /** Encabezado propio de la pantalla del servicio (ej. "Restaurantes" / "Cartas y menús cerca de ti") —
   * si no se pasa, no se muestra (la Guía de negocios general ya trae su propio título de pantalla). */
  titulo?: string;
  subtitulo?: string;
  placeholderBusqueda?: string;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { comunidad } = useComunidadActiva();
  const [categoriaId, setCategoriaId] = useState<string | undefined>(categoriaIdInicial);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const { data: categorias } = useCategorias();

  useEffect(() => {
    const temporizador = setTimeout(() => setBusquedaDebounced(busqueda), RETRASO_BUSQUEDA_MS);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  const {
    data: negocios,
    isLoading,
    isError,
    refetch,
  } = useNegocios({
    comunidadId: comunidad?.id ?? "",
    categoriaId,
    // Si ya se eligió una categoría puntual dentro del servicio, esa manda — servicioSlug solo
    // aplica mientras no se haya acotado más.
    servicioSlug: categoriaId ? undefined : servicioSlugFijo,
    busqueda: busquedaDebounced.trim() || undefined,
    limite: 30,
  });

  // Con servicio fijo, el filtro de categorías (si se pide) se limita a las suyas — ej. Market
  // Space solo ofrece Moda/Hogar/Emprendimientos, no las 13 categorías de la app entera.
  const categoriasDelAmbito = useMemo(
    () => (servicioSlugFijo ? (categorias ?? []).filter((c) => c.servicioSlug === servicioSlugFijo) : categorias ?? []),
    [categorias, servicioSlugFijo]
  );
  const listaCategorias = useMemo(
    () => [{ id: undefined, nombre: textos.buscar.todos }, ...categoriasDelAmbito],
    [categoriasDelAmbito]
  );

  const plantilla = servicioSlugFijo ? PLANTILLA_POR_SERVICIO[servicioSlugFijo] : undefined;
  const esCatalogo = plantilla === "catalogo";

  function alTocar(negocio: Negocio, vistaFoto?: View | null, radio = 8) {
    abrirNegocio(negocio.id, { vista: vistaFoto ?? null, url: negocio.fotoPrincipalUrl, radio });
  }

  function renderizarTarjeta(negocio: Negocio, indice: number) {
    if (plantilla === "menu") return <TarjetaNegocioMenu negocio={negocio} categorias={categorias} onPress={(vista) => alTocar(negocio, vista, 10)} />;
    if (plantilla === "catalogo") return <TarjetaNegocioCatalogo negocio={negocio} onPress={() => alTocar(negocio)} />;
    return <TarjetaNegocio negocio={negocio} onPress={(vista) => alTocar(negocio, vista)} />;
  }

  return (
    <View style={styles.contenedor}>
      {titulo ? (
        // Sin header nativo en esta pantalla (ver servicios/_layout.tsx) — la flecha de volver y
        // el padding de la muesca/notch corren por cuenta de este bloque.
        <View style={[styles.encabezadoServicio, { paddingTop: insets.top }]}>
          <View style={styles.filaTitulo}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/servicios"))}
              hitSlop={10}
              style={styles.botonVolver}
            >
              <Ionicons name="chevron-back" size={24} color={colores.texto} />
            </Pressable>
            <Text style={styles.tituloServicio}>{titulo}</Text>
          </View>
          {subtitulo ? <Text style={styles.subtituloServicio}>{subtitulo}</Text> : null}
        </View>
      ) : null}

      <View style={styles.buscador}>
        <Ionicons name="search" size={16} color={colores.textoSuave} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder={placeholderBusqueda ?? `${textos.buscar.placeholder} ${comunidad?.nombre ?? ""}`}
          placeholderTextColor={colores.textoTenue}
          style={styles.entradaTexto}
        />
        {busqueda ? (
          <Pressable onPress={() => setBusqueda("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colores.textoTenue} />
          </Pressable>
        ) : null}
      </View>

      {mostrarFiltroCategorias ? (
        <FlashList
          horizontal
          data={listaCategorias}
          keyExtractor={(item, index) => item.id ?? `todos-${index}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filaChips}
          renderItem={({ item }) => (
            <ChipCategoria
              etiqueta={item.nombre}
              activo={categoriaId === item.id}
              onPress={() => setCategoriaId(item.id)}
            />
          )}
        />
      ) : null}

      <Text style={styles.contador}>
        {negocios ? `${negocios.items.length} ${textos.buscar.resultados}` : ""}
      </Text>

      {isLoading ? (
        <EsqueletoListaNegocios />
      ) : isError ? (
        <EstadoError onReintentar={() => refetch()} />
      ) : (
        <FlashList
          key={esCatalogo ? "grid" : "lista"}
          data={negocios?.items ?? []}
          keyExtractor={(item) => item.id}
          numColumns={esCatalogo ? 2 : 1}
          contentContainerStyle={{ paddingBottom: espaciado.xl }}
          ItemSeparatorComponent={plantilla === "menu" ? () => <View style={{ height: espaciado.md }} /> : undefined}
          ListEmptyComponent={<EstadoVacio titulo={textos.buscar.sinResultados} />}
          renderItem={({ item, index }) => (
            <EntradaAnimada
              retraso={Math.min(index, 8) * 40}
              style={esCatalogo ? styles.celdaGrid : undefined}
            >
              {renderizarTarjeta(item, index)}
            </EntradaAnimada>
          )}
        />
      )}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
      paddingHorizontal: espaciado.lg,
      paddingTop: espaciado.lg,
    },
    encabezadoServicio: {
      marginBottom: espaciado.sm,
    },
    filaTitulo: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.xs,
      marginLeft: -espaciado.xs,
    },
    botonVolver: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    tituloServicio: {
      ...tipografia.titulo,
      fontSize: 22,
      color: colores.texto,
    },
    subtituloServicio: {
      ...tipografia.cuerpo,
      fontSize: 13,
      color: colores.textoSuave,
      marginTop: 2,
    },
    buscador: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.fondo,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colores.texto,
      paddingHorizontal: espaciado.md,
      height: 44,
      marginBottom: espaciado.md,
    },
    entradaTexto: {
      flex: 1,
      ...tipografia.cuerpo,
      color: colores.texto,
      ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
    },
    filaChips: {
      gap: espaciado.sm,
      paddingBottom: espaciado.sm,
    },
    contador: {
      ...tipografia.pie,
      color: colores.textoSuave,
      marginBottom: espaciado.xs,
    },
    celdaGrid: {
      flex: 1,
      margin: espaciado.xs,
    },
  });
}
