import { StyleSheet, Text, View } from "react-native";
import { Negocio } from "@app-vecinos/tipos";
import { PaletaColores, tipografia, useColores } from "../../disenio";
import { estaAbiertoAhora } from "../../utilidades/horarios";
import { formatearDistancia, minutosCaminando } from "../../utilidades/distancia";
import { FotoNegocio } from "../FotoNegocio";
import { Tocable } from "../Tocable";

/** "250 m · abierto" o "6 min · cerrado": la distancia real si el backend la mandó, si no los minutos aproximados. */
export function textoCercania(negocio: Negocio): { texto: string; abierto: boolean } {
  const abierto = estaAbiertoAhora(negocio.horarios);
  const distancia =
    negocio.distanciaM != null ? formatearDistancia(negocio.distanciaM) : `${minutosCaminando(negocio.coordenada)} min`;
  return { texto: `${distancia} · ${abierto ? "abierto" : "cerrado"}`, abierto };
}

/** Foto vertical de un negocio, como una vitrina de tienda: la fila "Cerca de ti" de Inicio. */
export function TarjetaVitrina({ negocio, onPress }: { negocio: Negocio; onPress: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const { texto, abierto } = textoCercania(negocio);

  return (
    <Tocable
      style={styles.contenedor}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${negocio.nombre}, ${texto}`}
    >
      <FotoNegocio nombre={negocio.nombre} url={negocio.fotoPrincipalUrl} style={styles.foto} tamanoIniciales={34} />
      <Text style={styles.nombre} numberOfLines={2}>
        {negocio.nombre}
      </Text>
      <View style={styles.filaMeta}>
        {abierto ? <View style={styles.punto} /> : null}
        <Text style={styles.meta} numberOfLines={1}>
          {texto}
        </Text>
      </View>
    </Tocable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: { width: 128 },
    foto: { width: 128, height: 156, borderRadius: 8 },
    nombre: {
      ...tipografia.cuerpoDestacado,
      fontFamily: "SchibstedGrotesk_700Bold",
      fontSize: 13,
      lineHeight: 16,
      color: colores.texto,
      marginTop: 6,
    },
    filaMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
    punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.abierto },
    meta: { ...tipografia.pie, fontSize: 11.5, color: colores.textoSuave, flexShrink: 1 },
  });
}
