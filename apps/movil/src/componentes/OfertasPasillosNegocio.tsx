import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { OfertaNegocio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { useTema } from "../estado/useTema";
import { urlCompleta } from "../utilidades/media";
import { SinFoto } from "./SinFoto";

function formatearPrecio(precio: number) {
  return `S/ ${precio % 1 === 0 ? precio.toFixed(0) : precio.toFixed(2)}`;
}

export function OfertasPasillosNegocio({
  ofertas,
  pasillos,
  negocioFotoUrl,
}: {
  ofertas: OfertaNegocio[];
  pasillos: string[];
  /** No hay foto propia por oferta en el modelo — se reusa la foto principal del negocio. */
  negocioFotoUrl?: string | null;
}) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores, modo === "oscuro");

  if (ofertas.length === 0 && pasillos.length === 0) return null;

  return (
    <View>
      {ofertas.length > 0 ? (
        <>
          <Text style={styles.tituloSeccion}>Ofertas de la semana</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaOfertas}>
            {ofertas.map((oferta) => (
              <View key={oferta.nombre} style={styles.tarjetaOferta}>
                {negocioFotoUrl ? (
                  <Image source={{ uri: urlCompleta(negocioFotoUrl) }} style={styles.foto} />
                ) : (
                  <SinFoto icono="pricetag-outline" tamanoIcono={18} style={styles.foto} />
                )}
                <Text style={styles.cinta}>{oferta.etiqueta}</Text>
                <View style={styles.infoOferta}>
                  <Text style={styles.nombreOferta} numberOfLines={1}>
                    {oferta.nombre}
                  </Text>
                  {oferta.precioOriginal ? (
                    <Text style={styles.precioAntes}>{formatearPrecio(oferta.precioOriginal)}</Text>
                  ) : null}
                  <Text style={styles.precioOferta}>{formatearPrecio(oferta.precio)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      {pasillos.length > 0 ? (
        <>
          <Text style={styles.tituloSeccion}>Pasillos</Text>
          <View style={styles.filaPasillos}>
            {pasillos.map((pasillo) => (
              <View key={pasillo} style={styles.chipPasillo}>
                <Text style={styles.chipPasilloTexto}>{pasillo}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores, oscuro: boolean) {
  return StyleSheet.create({
    tituloSeccion: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
      marginTop: espaciado.md,
      marginBottom: espaciado.sm,
    },
    filaOfertas: {
      marginBottom: espaciado.xs,
    },
    tarjetaOferta: {
      width: 120,
      marginRight: espaciado.sm,
      borderRadius: radios.md,
      borderWidth: 1,
      borderColor: colores.borde,
      overflow: "hidden",
    },
    foto: {
      width: "100%",
      height: 74,
    },
    cinta: {
      ...tipografia.pie,
      fontSize: 10,
      fontFamily: "PlusJakartaSans_800ExtraBold",
      color: "#ffffff",
      backgroundColor: colores.acentoFuerte,
      position: "absolute",
      top: 6,
      left: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radios.sm,
    },
    infoOferta: {
      padding: espaciado.sm,
      gap: 2,
    },
    nombreOferta: {
      ...tipografia.pie,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.texto,
    },
    precioAntes: {
      ...tipografia.pie,
      fontSize: 10.5,
      color: colores.textoTenue,
      textDecorationLine: "line-through",
    },
    precioOferta: {
      ...tipografia.cuerpoDestacado,
      fontSize: 12.5,
      color: colores.primarioFuerte,
    },
    filaPasillos: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
    },
    // Mostaza/tan — a propósito distinto del verde/coral de marca (son "pasillos" de
    // supermercado, no un estado ni una acción). Par claro/oscuro propio, no forma parte de
    // PaletaColores porque es un acento decorativo de un solo componente.
    chipPasillo: {
      backgroundColor: oscuro ? "#3a3018" : "#f6ecd6",
      paddingHorizontal: espaciado.sm,
      paddingVertical: 5,
      borderRadius: radios.completo,
    },
    chipPasilloTexto: {
      ...tipografia.pie,
      fontSize: 11,
      fontFamily: "PlusJakartaSans_700Bold",
      color: oscuro ? "#e0b565" : "#b8862e",
    },
  });
}
