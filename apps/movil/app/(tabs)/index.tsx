import { useState } from "react";
import { router } from "expo-router";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { textos } from "../../src/i18n/es";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useCategorias } from "../../src/datos/hooks/useCategorias";
import { useNegocios } from "../../src/datos/hooks/useNegocios";
import { useAvisos } from "../../src/datos/hooks/useAvisos";
import { BarraBusqueda } from "../../src/componentes/BarraBusqueda";
import { BarraSuperior } from "../../src/componentes/BarraSuperior";
import { CarruselAvisos } from "../../src/componentes/CarruselAvisos";
import { CarruselPublicidad } from "../../src/componentes/CarruselPublicidad";
import { HojaInferior } from "../../src/componentes/HojaInferior";
import { SelectorComunidad } from "../../src/componentes/SelectorComunidad";
import { TarjetaCategoria } from "../../src/componentes/TarjetaCategoria";
import { TarjetaCategoriaDestacada } from "../../src/componentes/TarjetaCategoriaDestacada";
import { TarjetaDestacadoGrande } from "../../src/componentes/TarjetaDestacadoGrande";
import { RielMiniNegocios } from "../../src/componentes/RielMiniNegocios";
import { TarjetaNegocio } from "../../src/componentes/TarjetaNegocio";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";
import { EstadoError } from "../../src/componentes/EstadoError";
import { EsqueletoListaNegocios } from "../../src/componentes/EsqueletoNegocio";
import { PermisoNotificaciones } from "../../src/componentes/PermisoNotificaciones";
import { useNotificaciones } from "../../src/estado/useNotificaciones";

// Las 2 categorías más usadas se destacan arriba con tarjeta grande — el resto sigue en la fila
// chica de siempre. Ver docs/decisiones/0030-categorias-destacadas-grandes.md.
const SLUGS_DESTACADOS = ["restaurantes", "supermercados"];

export default function Inicio() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const { comunidad } = useComunidadActiva();
  const [hojaComunidadVisible, setHojaComunidadVisible] = useState(false);
  const [permisoVisible, setPermisoVisible] = useState(false);
  const permisoDecidido = useNotificaciones((estado) => estado.permisoDecidido);
  const { data: categorias } = useCategorias();
  const {
    data: negocios,
    isLoading,
    isError,
    refetch,
  } = useNegocios({
    comunidadId: comunidad?.id ?? "",
    limite: 6,
  });
  const { data: destacados } = useNegocios({ comunidadId: comunidad?.id ?? "", limite: 8 });
  const { data: avisos } = useAvisos(comunidad?.id);

  const destacadoPrincipal = destacados?.items[0];
  const destacadosRestantes = destacados?.items.slice(1) ?? [];

  const categoriasDestacadas = (categorias ?? []).filter((c) => SLUGS_DESTACADOS.includes(c.slug));
  const categoriasResto = (categorias ?? []).filter((c) => !SLUGS_DESTACADOS.includes(c.slug));

  function alTocarCampana() {
    if (!permisoDecidido) {
      setPermisoVisible(true);
    } else {
      router.push("/notificaciones");
    }
  }

  function alTocarCategoria(categoriaId: string) {
    router.push({ pathname: "/servicios/negocios", params: { categoriaId } });
  }

  return (
    <View style={styles.raiz}>
      <BarraSuperior
        nombreComunidad={comunidad?.nombre ?? "…"}
        onAbrirComunidad={() => setHojaComunidadVisible(true)}
        onAbrirAvisos={alTocarCampana}
      />

      <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido}>
        <BarraBusqueda
          placeholder="Negocios, platos y productos"
          onPress={() => router.push("/buscar")}
        />

        <CarruselAvisos avisos={avisos ?? []} onPress={() => router.push("/comunidad")} />

        <Text style={styles.encabezado}>{textos.inicio.categorias}</Text>

        {categoriasDestacadas.length > 0 ? (
          <View style={styles.filaDestacadas}>
            {categoriasDestacadas.map((cat) => (
              <TarjetaCategoriaDestacada
                key={cat.id}
                nombre={cat.nombre}
                fotoUrl={cat.fotoUrl}
                onPress={() => alTocarCategoria(cat.id)}
              />
            ))}
          </View>
        ) : null}

        <FlatList
          horizontal
          data={categoriasResto}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filaCategorias}
          renderItem={({ item, index }) => (
            <TarjetaCategoria
              nombre={item.nombre}
              icono={item.icono}
              fotoUrl={item.fotoUrl}
              indice={index}
              onPress={() => alTocarCategoria(item.id)}
            />
          )}
        />

        <CarruselPublicidad />

        {destacadoPrincipal ? (
          <>
            <Text style={styles.encabezado}>El más visitado esta semana</Text>
            <TarjetaDestacadoGrande
              negocio={destacadoPrincipal}
              onPress={() => router.push(`/negocio/${destacadoPrincipal.id}`)}
            />
          </>
        ) : null}

        {destacadosRestantes.length > 0 ? (
          <RielMiniNegocios
            negocios={destacadosRestantes}
            onSeleccionar={(negocio) => router.push(`/negocio/${negocio.id}`)}
          />
        ) : null}

        <Text style={styles.encabezado}>{textos.inicio.cercaDeTi}</Text>
        {isLoading ? (
          <EsqueletoListaNegocios cantidad={3} />
        ) : isError ? (
          <EstadoError onReintentar={() => refetch()} />
        ) : negocios && negocios.items.length > 0 ? (
          negocios.items.map((negocio) => (
            <TarjetaNegocio
              key={negocio.id}
              negocio={negocio}
              onPress={() => router.push(`/negocio/${negocio.id}`)}
            />
          ))
        ) : (
          <EstadoVacio titulo={textos.buscar.sinResultados} />
        )}
      </ScrollView>

      <HojaInferior visible={hojaComunidadVisible} onCerrar={() => setHojaComunidadVisible(false)}>
        <SelectorComunidad onSeleccionar={() => setHojaComunidadVisible(false)} />
      </HojaInferior>

      <PermisoNotificaciones visible={permisoVisible} onCerrar={() => setPermisoVisible(false)} />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    raiz: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenedor: {
      flex: 1,
    },
    contenido: {
      padding: espaciado.lg,
      paddingTop: espaciado.sm,
      gap: espaciado.sm,
    },
    // Sin marginTop: el ScrollView ya pone `gap` entre secciones — sumarle un margen acá
    // duplicaba el espacio en blanco entre una sección y la siguiente.
    encabezado: {
      ...tipografia.displaySeccion,
      color: colores.texto,
      marginBottom: espaciado.xs,
    },
    filaDestacadas: {
      flexDirection: "row",
      gap: espaciado.sm,
      marginBottom: espaciado.sm,
    },
    filaCategorias: {
      gap: espaciado.xs,
    },
  });
}
