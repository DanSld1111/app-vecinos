import { Animated, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../src/disenio";
import { textos } from "../../src/i18n/es";
import { useNegocio } from "../../src/datos/hooks/useNegocios";
import { useCategorias } from "../../src/datos/hooks/useCategorias";
import { BotonPrimario } from "../../src/componentes/BotonPrimario";
import { EstadoError } from "../../src/componentes/EstadoError";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";
import { usePulso } from "../../src/componentes/EsqueletoNegocio";
import { MenuNegocio } from "../../src/componentes/MenuNegocio";
import { CatalogoNegocio } from "../../src/componentes/CatalogoNegocio";
import { ServiciosNegocio } from "../../src/componentes/ServiciosNegocio";
import { CategoriasRubroNegocio } from "../../src/componentes/CategoriasRubroNegocio";
import { OfertasPasillosNegocio } from "../../src/componentes/OfertasPasillosNegocio";
import { GaleriaNegocio } from "../../src/componentes/GaleriaNegocio";
import { SinFoto } from "../../src/componentes/SinFoto";
import { MiniMapaNegocio } from "../../src/componentes/MiniMapaNegocio";
import { ResumenHorario } from "../../src/componentes/ResumenHorario";
import { useProductosPorNegocio } from "../../src/datos/hooks/useProductos";
import { resolverArquetipoFicha } from "../../src/utilidades/arquetipoFicha";
import { urlCompleta } from "../../src/utilidades/media";
import { marca } from "../../src/config/marca";
import { ResenasNegocio } from "../../src/componentes/ResenasNegocio";

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: negocio, isLoading, isError, refetch } = useNegocio(id);
  const { data: productos } = useProductosPorNegocio(negocio?.id);
  const { data: categorias } = useCategorias();

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

  function abrirWhatsapp() {
    if (!negocio!.whatsapp) return;
    Linking.openURL(`https://wa.me/${negocio!.whatsapp}`);
  }

  function llamar() {
    if (!negocio!.telefono) return;
    Linking.openURL(`tel:${negocio!.telefono}`);
  }

  async function compartir() {
    try {
      await Share.share({
        message: `${negocio!.nombre}\n\n${negocio!.descripcion}\n\nEncuéntralo en ${marca.nombreApp}.`,
      });
    } catch {
      // El usuario canceló o la plataforma no soporta compartir nativo — no es un error real.
    }
  }

  const arquetipo = resolverArquetipoFicha(negocio, categorias);

  let contenido;
  if (arquetipo === "servicios" && negocio.serviciosOfrecidos?.length) {
    contenido = <ServiciosNegocio servicios={negocio.serviciosOfrecidos} />;
  } else if (arquetipo === "categorias" && negocio.rubrosDisponibles?.length) {
    contenido = <CategoriasRubroNegocio rubros={negocio.rubrosDisponibles} />;
  } else if (arquetipo === "ofertas" && (negocio.ofertas?.length || negocio.pasillos?.length)) {
    contenido = (
      <OfertasPasillosNegocio
        ofertas={negocio.ofertas ?? []}
        pasillos={negocio.pasillos ?? []}
        negocioFotoUrl={negocio.fotoPrincipalUrl}
      />
    );
  } else if (arquetipo === "catalogo" && productos && productos.length > 0) {
    contenido = <CatalogoNegocio productos={productos} />;
  } else if (productos && productos.length > 0) {
    contenido = <MenuNegocio productos={productos} />;
  } else {
    contenido = <GaleriaNegocio fotos={negocio.fotosGaleria} />;
  }

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido}>
      {negocio.fotoPrincipalUrl ? (
        <Image source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.fotoPrincipal} />
      ) : (
        <SinFoto tamanoIcono={32} style={styles.fotoPrincipal} />
      )}

      <View style={styles.filaNombre}>
        <Text style={[styles.nombre, { flex: 1 }]}>{negocio.nombre}</Text>
        <Pressable onPress={compartir} hitSlop={10} style={styles.botonCompartir}>
          <Ionicons name="share-social-outline" size={20} color={colores.textoSuave} />
        </Pressable>
      </View>
      <Text style={styles.descripcion}>{negocio.descripcion}</Text>

      <View style={styles.accionRow}>
        <BotonPrimario
          texto={textos.ficha.whatsapp}
          onPress={abrirWhatsapp}
          style={styles.accionBoton}
        />
        <BotonPrimario
          texto={textos.ficha.llamar}
          onPress={llamar}
          variante="fantasma"
          style={styles.accionBoton}
        />
      </View>

      {contenido}

      <Text style={styles.encabezado}>{textos.ficha.direccion}</Text>
      <MiniMapaNegocio coordenada={negocio.coordenada} direccion={negocio.direccion} />

      <Text style={styles.encabezado}>{textos.ficha.horario}</Text>
      <ResumenHorario horarios={negocio.horarios} />

      <Text style={styles.encabezado}>Reseñas</Text>
      <ResenasNegocio negocioId={negocio.id} />

      {negocio.verificadoEn ? (
        <Text style={styles.verificado}>Datos verificados el {negocio.verificadoEn}</Text>
      ) : (
        <Text style={styles.sinVerificar}>Reportado por un vecino, aún sin verificar</Text>
      )}
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenido: {
      padding: espaciado.lg,
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
    filaNombre: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: espaciado.sm,
    },
    nombre: {
      ...tipografia.titulo,
      color: colores.texto,
    },
    botonCompartir: {
      padding: 4,
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
    encabezado: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
      marginTop: espaciado.md,
      marginBottom: espaciado.xs,
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
