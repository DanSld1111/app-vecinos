import { Image, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../../src/disenio";
import { useNegocio } from "../../../src/datos/hooks/useNegocios";
import { EstadoError } from "../../../src/componentes/EstadoError";
import { EstadoVacio } from "../../../src/componentes/EstadoVacio";
import { SinFoto } from "../../../src/componentes/SinFoto";
import { MiniMapaNegocio } from "../../../src/componentes/MiniMapaNegocio";
import { listaSemanaCompleta } from "../../../src/utilidades/horarios";
import { urlCompleta } from "../../../src/utilidades/media";

export default function InformacionNegocio() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: negocio, isLoading, isError, refetch } = useNegocio(id);

  if (isLoading) return <View style={styles.contenedor} />;
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

  const semana = listaSemanaCompleta(negocio.horarios);

  return (
    <View style={styles.contenedor}>
      <View style={styles.filaLogo}>
        {negocio.fotoPrincipalUrl ? (
          <Image source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.logo} />
        ) : (
          <SinFoto tamanoIcono={24} style={styles.logo} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.nombre}>{negocio.nombre}</Text>
          <Text style={styles.descripcion} numberOfLines={2}>
            {negocio.descripcion}
          </Text>
        </View>
      </View>

      <Text style={styles.encabezado}>Ubicación</Text>
      <MiniMapaNegocio coordenada={negocio.coordenada} direccion={negocio.direccion} />

      <Text style={styles.encabezado}>Horarios</Text>
      <View style={styles.tarjetaHorario}>
        {semana.map((d) => (
          <View key={d.dia} style={[styles.filaDia, d.esHoy && styles.filaDiaHoy]}>
            <Text style={[styles.nombreDia, d.esHoy && styles.textoHoy]}>{d.nombre}</Text>
            <Text style={[styles.valorDia, d.esHoy && styles.textoHoy]}>{d.texto}</Text>
          </View>
        ))}
      </View>

      {negocio.acercaDelNegocio ? (
        <>
          <Text style={styles.encabezado}>Acerca del negocio</Text>
          <Text style={styles.acerca}>{negocio.acercaDelNegocio}</Text>
        </>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
      padding: espaciado.lg,
      gap: espaciado.xs,
    },
    filaLogo: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      marginBottom: espaciado.sm,
    },
    logo: {
      width: 54,
      height: 54,
      borderRadius: radios.md,
    },
    nombre: {
      ...tipografia.titulo,
      fontSize: 17,
      color: colores.texto,
    },
    descripcion: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    encabezado: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
      marginTop: espaciado.md,
      marginBottom: espaciado.xs,
    },
    tarjetaHorario: {
      backgroundColor: colores.superficieHundida,
      borderRadius: radios.md,
      padding: espaciado.sm,
    },
    filaDia: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: espaciado.xs,
      paddingHorizontal: espaciado.sm,
      borderRadius: radios.sm,
    },
    filaDiaHoy: {
      backgroundColor: colores.primarioSuave,
    },
    nombreDia: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
    },
    valorDia: {
      ...tipografia.cuerpo,
      color: colores.texto,
    },
    textoHoy: {
      color: colores.primarioFuerte,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    acerca: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      lineHeight: 20,
    },
  });
}
