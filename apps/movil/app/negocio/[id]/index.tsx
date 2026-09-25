import { useEffect, useState } from "react";
import { Alert, Animated, Linking, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../../src/disenio";
import { textos } from "../../../src/i18n/es";
import { repositorioNegocios } from "../../../src/datos/fabricaRepositorios";
import { useNegocio } from "../../../src/datos/hooks/useNegocios";
import { useCategorias } from "../../../src/datos/hooks/useCategorias";
import { useFavoritosIds, useInvalidarFavoritos, alternarFavorito } from "../../../src/datos/hooks/useFavoritos";
import { useSesion } from "../../../src/estado/useSesion";
import { BotonPrimario } from "../../../src/componentes/BotonPrimario";
import { EstadoError } from "../../../src/componentes/EstadoError";
import { EstadoVacio } from "../../../src/componentes/EstadoVacio";
import { usePulso } from "../../../src/componentes/EsqueletoNegocio";
import { MenuNegocio } from "../../../src/componentes/MenuNegocio";
import { CatalogoNegocio } from "../../../src/componentes/CatalogoNegocio";
import { ServiciosNegocio } from "../../../src/componentes/ServiciosNegocio";
import { CategoriasRubroNegocio } from "../../../src/componentes/CategoriasRubroNegocio";
import { OfertasPasillosNegocio } from "../../../src/componentes/OfertasPasillosNegocio";
import { GaleriaNegocio } from "../../../src/componentes/GaleriaNegocio";
import { SinFoto } from "../../../src/componentes/SinFoto";
import { MenuAccionesNegocio } from "../../../src/componentes/MenuAccionesNegocio";
import { useProductosPorNegocio } from "../../../src/datos/hooks/useProductos";
import { resolverArquetipoFicha } from "../../../src/utilidades/arquetipoFicha";
import { urlCompleta } from "../../../src/utilidades/media";
import { marca } from "../../../src/config/marca";

function EsqueletoFicha() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const opacidad = usePulso();
  return (
    <Animated.View style={[styles.contenido, { opacity: opacidad }]}>
      <View style={[styles.fotoPrincipal, { backgroundColor: colores.superficieHundida2 }]} />
      <View style={styles.esqueletoLinea} />
      <View style={[styles.esqueletoLinea, { width: "60%" }]} />
    </Animated.View>
  );
}

export default function FichaNegocio() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: negocio, isLoading, isError, refetch } = useNegocio(id);
  const { data: productos } = useProductosPorNegocio(negocio?.id);
  const { data: categorias } = useCategorias();
  const token = useSesion((estado) => estado.token);
  const { data: idsFavoritos } = useFavoritosIds();
  const invalidarFavoritos = useInvalidarFavoritos();
  const [busqueda, setBusqueda] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [favoritoOptimista, setFavoritoOptimista] = useState<boolean | null>(null);

  useEffect(() => {
    if (negocio?.id) void repositorioNegocios.registrarVisita(negocio.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocio?.id]);

  // Se reinicia el "optimista" cada vez que cambia de negocio — si no, al entrar a una ficha
  // distinta arrastraría el corazón lleno/vacío de la anterior hasta que cargue idsFavoritos.
  useEffect(() => {
    setFavoritoOptimista(null);
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.contenedor}>
        <EsqueletoFicha />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.contenedor}>
        <EstadoError onReintentar={() => refetch()} />
      </View>
    );
  }

  if (!negocio) {
    return (
      <View style={styles.contenedor}>
        <EstadoVacio titulo="No encontramos este negocio." />
      </View>
    );
  }

  const esFavorito = favoritoOptimista ?? idsFavoritos?.includes(negocio.id) ?? false;

  function abrirWhatsapp() {
    if (!negocio!.whatsapp) return;
    Linking.openURL(`https://wa.me/${negocio!.whatsapp}`);
  }

  function llamar() {
    if (!negocio!.telefono) return;
    Linking.openURL(`tel:${negocio!.telefono}`);
  }

  async function compartir() {
    setMenuVisible(false);
    try {
      await Share.share({
        // marca.dominio ("elisur.app") es el dominio de marca a futuro, pero todavía no apunta a
        // nada — hoy la app real vive en dawan.dev. Cuando exista en App Store/Play Store, este
        // link cambia por el de la tienda correspondiente.
        message: `${negocio!.nombre}\n\n${negocio!.descripcion}\n\nEncuéntralo en ${marca.nombreApp}: https://dawan.dev`,
      });
    } catch {
      // El usuario canceló o la plataforma no soporta compartir nativo — no es un error real.
    }
  }

  function verInformacion() {
    setMenuVisible(false);
    router.push(`/negocio/${negocio!.id}/informacion`);
  }

  async function tocarFavorito() {
    if (!token) {
      // "modo prueba" no tiene cuenta a la que asociar el favorito — no hay a dónde mandarlo a
      // loguearse desde acá sin cerrar la sesión de invitado, así que se explica en vez de
      // navegar a algo que no es esto (/cuenta es el login de "modo gestión", de otro dueño).
      Alert.alert("Inicia sesión para guardar favoritos", "Necesitas tu cuenta de vecino — \"modo prueba\" no guarda favoritos.");
      return;
    }
    const anterior = esFavorito;
    setFavoritoOptimista(!anterior);
    try {
      await alternarFavorito(negocio!.id, token, anterior);
      invalidarFavoritos();
    } catch {
      setFavoritoOptimista(anterior);
    }
  }

  const arquetipo = resolverArquetipoFicha(negocio, categorias);

  let contenido;
  if (arquetipo === "servicios" && negocio.serviciosOfrecidos?.length) {
    contenido = <ServiciosNegocio servicios={negocio.serviciosOfrecidos} moneda={negocio.moneda} busqueda={busqueda} />;
  } else if (arquetipo === "categorias" && negocio.rubrosDisponibles?.length) {
    contenido = <CategoriasRubroNegocio rubros={negocio.rubrosDisponibles} />;
  } else if (arquetipo === "ofertas" && (negocio.ofertas?.length || negocio.pasillos?.length)) {
    contenido = (
      <OfertasPasillosNegocio
        ofertas={negocio.ofertas ?? []}
        pasillos={negocio.pasillos ?? []}
        negocioFotoUrl={negocio.fotoPrincipalUrl}
        moneda={negocio.moneda}
        busqueda={busqueda}
      />
    );
  } else if (arquetipo === "catalogo" && productos && productos.length > 0) {
    contenido = <CatalogoNegocio productos={productos} moneda={negocio.moneda} whatsapp={negocio.whatsapp} busqueda={busqueda} />;
  } else if (productos && productos.length > 0) {
    contenido = <MenuNegocio productos={productos} moneda={negocio.moneda} busqueda={busqueda} />;
  } else {
    contenido = <GaleriaNegocio fotos={negocio.fotosGaleria} />;
  }

  return (
    <View style={styles.contenedor}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.encabezado, { paddingTop: insets.top + espaciado.sm }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          hitSlop={10}
          style={styles.botonRedondo}
        >
          <Ionicons name="chevron-back" size={22} color={colores.texto} />
        </Pressable>
        <View style={styles.buscador}>
          <Ionicons name="search" size={15} color={colores.textoTenue} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder={`Buscar en ${negocio.nombre}…`}
            placeholderTextColor={colores.textoTenue}
            style={styles.entradaBuscador}
            numberOfLines={1}
          />
        </View>
        <Pressable onPress={tocarFavorito} hitSlop={10} style={styles.botonRedondo}>
          <Ionicons
            name={esFavorito ? "heart" : "heart-outline"}
            size={19}
            color={esFavorito ? colores.acentoFuerte : colores.texto}
          />
        </Pressable>
        <Pressable onPress={() => setMenuVisible(true)} hitSlop={10} style={styles.botonRedondo}>
          <Ionicons name="ellipsis-vertical" size={18} color={colores.texto} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        {negocio.fotoPrincipalUrl ? (
          <Animated.Image
            source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }}
            style={styles.fotoPrincipal}
          />
        ) : (
          <SinFoto tamanoIcono={32} style={styles.fotoPrincipal} />
        )}

        <Text style={styles.descripcion}>{negocio.descripcion}</Text>

        <View style={styles.accionRow}>
          <BotonPrimario texto={textos.ficha.whatsapp} onPress={abrirWhatsapp} style={styles.accionBoton} />
          <BotonPrimario texto={textos.ficha.llamar} onPress={llamar} variante="fantasma" style={styles.accionBoton} />
        </View>

        {contenido}

        {negocio.verificadoEn ? (
          <Text style={styles.verificado}>Datos verificados el {negocio.verificadoEn}</Text>
        ) : (
          <Text style={styles.sinVerificar}>Reportado por un vecino, aún sin verificar</Text>
        )}
      </ScrollView>

      <MenuAccionesNegocio
        visible={menuVisible}
        nombreNegocio={negocio.nombre}
        onCerrar={() => setMenuVisible(false)}
        onVerInformacion={verInformacion}
        onCompartir={compartir}
      />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    encabezado: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      paddingHorizontal: espaciado.lg,
      paddingBottom: espaciado.sm,
    },
    botonRedondo: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
    buscador: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor: colores.superficieHundida,
      borderRadius: radios.completo,
      paddingHorizontal: espaciado.md,
      height: 38,
      minWidth: 0,
    },
    entradaBuscador: {
      flex: 1,
      ...tipografia.cuerpo,
      fontSize: 12.5,
      color: colores.texto,
      padding: 0,
    },
    contenido: {
      padding: espaciado.lg,
      paddingTop: 0,
      gap: espaciado.xs,
    },
    fotoPrincipal: {
      width: "100%",
      height: 180,
      borderRadius: radios.md,
      marginBottom: espaciado.md,
    },
    esqueletoLinea: {
      height: 14,
      borderRadius: 7,
      backgroundColor: colores.superficieHundida2,
      width: "80%",
      marginBottom: espaciado.sm,
    },
    descripcion: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      marginBottom: espaciado.md,
    },
    accionRow: {
      flexDirection: "row",
      gap: espaciado.sm,
      marginBottom: espaciado.md,
    },
    accionBoton: {
      flex: 1,
    },
    verificado: {
      ...tipografia.pie,
      color: colores.primario,
      marginTop: espaciado.lg,
    },
    sinVerificar: {
      ...tipografia.pie,
      color: colores.advertencia,
      marginTop: espaciado.lg,
    },
  });
}
