import { FlatList, Image, Pressable, StyleSheet, Text } from "react-native";
import { Negocio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { estaAbiertoAhora } from "../utilidades/horarios";
import { minutosCaminando } from "../utilidades/distancia";
import { urlCompleta } from "../utilidades/media";
import { AvatarNegocio } from "./AvatarNegocio";

function MiniTarjeta({ negocio, onPress }: { negocio: Negocio; onPress: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const abierto = estaAbiertoAhora(negocio.horarios);
  const minutos = minutosCaminando(negocio.coordenada);

  return (
    <Pressable style={styles.tarjeta} onPress={onPress}>
      {negocio.fotoPrincipalUrl ? (
        <Image source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.imagen} />
      ) : (
        <AvatarNegocio nombre={negocio.nombre} size={72} radio={radios.sm} style={styles.imagen} />
      )}
      <Text style={styles.nombre} numberOfLines={2}>
        {negocio.nombre}
      </Text>
      <Text style={styles.dist}>
        🚶 {minutos} min · {abierto ? "Abierto" : "Cerrado"}
      </Text>
    </Pressable>
  );
}

export function RielMiniNegocios({
  negocios,
  onSeleccionar,
}: {
  negocios: Negocio[];
  onSeleccionar: (negocio: Negocio) => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <FlatList
      horizontal
      data={negocios}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={styles.fila}
      renderItem={({ item }) => (
        <MiniTarjeta negocio={item} onPress={() => onSeleccionar(item)} />
      )}
    />
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    fila: {
      gap: espaciado.sm,
    },
    tarjeta: {
      width: 118,
      borderRadius: radios.md,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: espaciado.sm,
    },
    imagen: {
      width: "100%",
      height: 72,
      borderRadius: radios.sm,
      marginBottom: espaciado.xs,
    },
    nombre: {
      ...tipografia.pie,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.texto,
      lineHeight: 15,
    },
    dist: {
      ...tipografia.pie,
      fontSize: 10,
      color: colores.textoTenue,
      marginTop: 4,
    },
  });
}
