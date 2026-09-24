import { useMemo, useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { textos } from "../i18n/es";
import { useComunidadActiva } from "../estado/comunidadActiva";
import { useCategorias } from "../datos/hooks/useCategorias";
import { useNegocios } from "../datos/hooks/useNegocios";
import { ChipCategoria } from "./ChipCategoria";
import { TarjetaNegocio } from "./TarjetaNegocio";
import { EstadoVacio } from "./EstadoVacio";
import { EstadoError } from "./EstadoError";
import { EsqueletoListaNegocios } from "./EsqueletoNegocio";

export function GuiaListado({
  servicioSlugFijo,
  categoriaIdInicial,
  mostrarFiltroCategorias = false,
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
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const { comunidad } = useComunidadActiva();
  const [categoriaId, setCategoriaId] = useState<string | undefined>(categoriaIdInicial);
  const [busqueda, setBusqueda] = useState("");
  const { data: categorias } = useCategorias();
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
    busqueda: busqueda.trim() || undefined,
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

  return (
    <View style={styles.contenedor}>
      <View style={styles.buscador}>
        <Ionicons name="search" size={16} color={colores.textoTenue} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder={`${textos.buscar.placeholder} ${comunidad?.nombre ?? ""}`}
          placeholderTextColor={colores.textoTenue}
          style={styles.entradaTexto}
        />
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
          data={negocios?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: espaciado.xl }}
          ItemSeparatorComponent={() => <View style={{ height: espaciado.sm }} />}
          ListEmptyComponent={<EstadoVacio titulo={textos.buscar.sinResultados} />}
          renderItem={({ item }) => (
            <TarjetaNegocio negocio={item} onPress={() => router.push(`/negocio/${item.id}`)} />
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
      backgroundColor: colores.superficieHundida,
      paddingHorizontal: espaciado.lg,
      paddingTop: espaciado.lg,
    },
    buscador: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.superficie,
      borderRadius: radios.completo,
      paddingHorizontal: espaciado.md,
      height: 46,
      marginBottom: espaciado.sm,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    entradaTexto: {
      flex: 1,
      ...tipografia.cuerpo,
      color: colores.texto,
    },
    filaChips: {
      gap: espaciado.sm,
      paddingBottom: espaciado.sm,
    },
    contador: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
      marginBottom: espaciado.xs,
    },
  });
}
