import { useEffect, useState } from "react";
import { router } from "expo-router";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { textos } from "../../src/i18n/es";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useUbicacionUsuario } from "../../src/estado/useUbicacionUsuario";
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
  const { coordenada, permiso: permisoUbicacion, asegurarUbicacion } = useUbicacionUsuario();

  useEffect(() => {
    void asegurarUbicacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Una sola lista — antes eran dos consultas separadas ("el más visitado" y "cerca de ti") con
  // el mismo criterio de fondo (creado_en DESC) detrás de nombres que prometían otra cosa. Con
  // ubicación, el backend ordena por distancia real (con tope) y desempata por popularidad; sin
  // ella, cae a popularidad — nunca al azar. Ver docs/decisiones/0073-inicio-orden-real.md.
  const {
    data: negocios,
    isLoading,
    isError,
    refetch,
  } = useNegocios({
    comunidadId: comunidad?.id ?? "",
    limite: 8,
    lat: coordenada?.lat,
    lng: coordenada?.lng,
  });
  const { data: avisos } = useAvisos(comunidad?.id);

  // El badge "🔥 Popular" es solo para quien de verdad está arriba en visitas reales — nunca el
  // primero de la lista porque sí, y nunca si nadie tiene visitas todavía.
  const idMasVisitado = (negocios?.items ?? []).reduce<{ id: string; visitas: number } | null>(
    (mejor, n) => (n.visitas7d > 0 && (!mejor || n.visitas7d > mejor.visitas) ? { id: n.id, visitas: n.visitas7d } : mejor),
    null,
  )?.id;

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

        <View style={styles.filaEncabezadoCerca}>
          <Text style={styles.encabezado}>{textos.inicio.cercaDeTi}</Text>
          {coordenada ? (
            <View style={styles.indicadorUbicacion}>
              <View style={styles.puntoVivo} />
              <Text style={styles.indicadorUbicacionTexto}>Usando tu ubicación</Text>
            </View>
          ) : null}
        </View>
        {isLoading ? (
          <EsqueletoListaNegocios cantidad={3} />
        ) : isError ? (
          <EstadoError onReintentar={() => refetch()} />
        ) : negocios && negocios.items.length > 0 ? (
          negocios.items.map((negocio) => (
            <TarjetaNegocio
              key={negocio.id}
              negocio={negocio}
              popular={negocio.id === idMasVisitado}
              onPress={() => router.push(`/negocio/${negocio.id}`)}
            />
          ))
        ) : (
          <EstadoVacio titulo={textos.buscar.sinResultados} />
        )}
      </ScrollView>

      {permisoUbicacion === "denegado" ? (
        <View style={styles.pieUbicacion}>
          <Text style={styles.pieUbicacionIcono}>📍</Text>
          <Text style={styles.pieUbicacionTexto}>
            Si no activas tu ubicación, ordenamos igual por popularidad y usamos el centro del distrito.
          </Text>
        </View>
      ) : null}

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
      // Antes espaciado.sm (8): con "El más visitado" y "Cerca de ti" fundidos en una sola
      // sección sobraba aire entre bloques — ver docs/decisiones/0073-inicio-orden-real.md.
      gap: espaciado.xs,
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
      marginBottom: espaciado.xs,
    },
    filaCategorias: {
      gap: espaciado.xs,
    },
    filaEncabezadoCerca: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: espaciado.xs,
    },
    indicadorUbicacion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    puntoVivo: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colores.primario,
    },
    indicadorUbicacionTexto: {
      ...tipografia.pie,
      fontSize: 10,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.primarioFuerte,
    },
    pieUbicacion: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.primarioFuerte,
      marginHorizontal: espaciado.lg,
      marginBottom: espaciado.sm,
      padding: espaciado.sm + 2,
      borderRadius: 12,
    },
    pieUbicacionIcono: {
      fontSize: 16,
    },
    pieUbicacionTexto: {
      ...tipografia.pie,
      fontSize: 10.5,
      color: "#ffffff",
      flex: 1,
    },
  });
}
