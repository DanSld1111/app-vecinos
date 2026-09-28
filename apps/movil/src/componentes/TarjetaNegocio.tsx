import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Negocio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { estaAbiertoAhora } from "../utilidades/horarios";
import { formatearDistancia, minutosCaminando } from "../utilidades/distancia";
import { FotoNegocio } from "./FotoNegocio";
import { Tocable } from "./Tocable";

/**
 * Fila de un negocio en listas (Guía de negocios, resultados de búsqueda): miniatura, nombre,
 * dirección y estado, separada por una línea fina en vez de una tarjeta con sombra.
 */
export function TarjetaNegocio({
  negocio,
  popular = false,
  onPress,
}: {
  negocio: Negocio;
  /** "Popular esta semana" — la decide quien arma la lista, no este componente. */
  popular?: boolean;
  onPress: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const abierto = estaAbiertoAhora(negocio.horarios);
  // Con distancia real del backend (viene cuando se pidió con GPS) se muestra ella; si no, los
  // minutos aproximados desde el centro del distrito. Ver docs/decisiones/0073.
  const tieneDistanciaReal = negocio.distanciaM != null;
  const minutos = tieneDistanciaReal
    ? Math.max(1, Math.round((negocio.distanciaM as number) / 80))
    : minutosCaminando(negocio.coordenada);
  const distancia = tieneDistanciaReal
    ? `${formatearDistancia(negocio.distanciaM as number)} · ${minutos} min`
    : `${minutos} min a pie`;

  return (
    <Tocable
      style={styles.contenedor}
      onPress={onPress}
      escala={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${negocio.nombre}, ${abierto ? "abierto" : "cerrado"}, ${distancia}`}
    >
      <FotoNegocio nombre={negocio.nombre} url={negocio.fotoPrincipalUrl} style={styles.miniatura} tamanoIniciales={19} />
      <View style={styles.texto}>
        <View style={styles.filaNombre}>
          <Text style={styles.nombre} numberOfLines={1}>
            {negocio.nombre}
          </Text>
          {negocio.verificadoEn ? <Ionicons name="checkmark-circle" size={14} color={colores.primario} /> : null}
        </View>
        <Text style={styles.direccion} numberOfLines={1}>
          {negocio.direccion}
        </Text>
        <View style={styles.filaTags}>
          <View style={[styles.punto, { backgroundColor: abierto ? colores.abierto : colores.textoTenue }]} />
          <Text style={styles.meta}>
            {abierto ? "Abierto" : "Cerrado"} · {distancia}
          </Text>
          {negocio.calificacionTotal > 0 ? (
            <>
              <Text style={styles.meta}> · </Text>
              <Ionicons name="star" size={11} color={colores.calificacion} />
              <Text style={styles.metaFuerte}> {negocio.calificacionPromedio}</Text>
            </>
          ) : null}
        </View>
        {popular ? <Text style={styles.popular}>Popular esta semana</Text> : null}
      </View>
    </Tocable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      paddingVertical: espaciado.md - 1,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colores.bordeFuerte,
      backgroundColor: colores.fondo,
    },
    miniatura: { width: 64, height: 64, borderRadius: 8 },
    texto: { flex: 1, minWidth: 0, gap: 1 },
    filaNombre: { flexDirection: "row", alignItems: "center", gap: 5 },
    nombre: {
      ...tipografia.cuerpoDestacado,
      fontFamily: "SchibstedGrotesk_700Bold",
      fontSize: 14.5,
      color: colores.texto,
      flexShrink: 1,
    },
    direccion: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave },
    filaTags: { flexDirection: "row", alignItems: "center", marginTop: 2 },
    punto: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    meta: { ...tipografia.pie, color: colores.textoSuave },
    metaFuerte: { ...tipografia.pie, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    popular: { ...tipografia.pie, fontSize: 11.5, fontFamily: "SchibstedGrotesk_600SemiBold", color: colores.acentoFuerte, marginTop: 2 },
  });
}
