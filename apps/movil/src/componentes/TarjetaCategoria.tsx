import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { useAnimacionLatido } from "../utilidades/useAnimacionLatido";
import { IconoCategoria } from "./IconoCategoria";

/** Ver docs/decisiones/0029-categorias-con-foto.md: la foto reemplaza al ícono de líneas en
 * esta tarjeta. El ícono se mantiene solo como respaldo, por si una categoría nueva todavía no
 * tiene foto subida desde el panel — nunca se inventa una foto que nadie subió.
 * `indice` (opcional): escalona el pulso de la foto para que las tarjetas de la fila no
 * "respiren" todas juntas — ver docs/decisiones/0032-animacion-categorias-inicio.md. */
export function TarjetaCategoria({
  nombre,
  icono,
  fotoUrl,
  grande = false,
  indice = 0,
  onPress,
}: {
  nombre: string;
  icono: string;
  fotoUrl: string | null;
  grande?: boolean;
  indice?: number;
  onPress: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const tamanio = grande ? 80 : 72;
  const escala = useAnimacionLatido(indice * 220);

  return (
    <Pressable style={styles.contenedor} onPress={onPress}>
      {fotoUrl ? (
        <Animated.Image
          source={{ uri: fotoUrl }}
          style={[styles.foto, { width: tamanio, height: tamanio, transform: [{ scale: escala }] }]}
        />
      ) : (
        <View style={[styles.icono, { width: tamanio, height: tamanio }]}>
          <IconoCategoria nombre={icono} size={grande ? 28 : 24} color={colores.primarioFuerte} />
        </View>
      )}
      <Text style={styles.nombre} numberOfLines={2}>
        {nombre}
      </Text>
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      alignItems: "center",
      gap: espaciado.xs,
      width: 84,
    },
    foto: {
      borderRadius: radios.lg,
    },
    icono: {
      borderRadius: radios.lg,
      backgroundColor: colores.primarioSuave,
      alignItems: "center",
      justifyContent: "center",
    },
    nombre: {
      ...tipografia.pie,
      fontSize: 11.5,
      color: colores.textoSuave,
      textAlign: "center",
      lineHeight: 14,
    },
  });
}
