import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Moneda, OfertaNegocio, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { useTema } from "../estado/useTema";
import { urlCompleta } from "../utilidades/media";
import { SinFoto } from "./SinFoto";
import { EntradaAnimada } from "./EntradaAnimada";

export function OfertasPasillosNegocio({
  ofertas,
  pasillos,
  negocioFotoUrl,
  moneda,
}: {
  ofertas: OfertaNegocio[];
  pasillos: string[];
  /** No hay foto propia por oferta en el modelo — se reusa la foto principal del negocio. */
  negocioFotoUrl?: string | null;
  moneda: Moneda;
}) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores, modo === "oscuro");
  const [busqueda, setBusqueda] = useState("");

  if (ofertas.length === 0 && pasillos.length === 0) return null;

  const termino = busqueda.trim().toLowerCase();
  const ofertasFiltradas = termino ? ofertas.filter((o) => o.nombre.toLowerCase().includes(termino)) : ofertas;

  return (
    <View>
      {ofertas.length > 0 ? (
        <View style={styles.buscador}>
          <Ionicons name="search" size={15} color={colores.textoTenue} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar producto en el super…"
            placeholderTextColor={colores.textoTenue}
            style={styles.entradaBuscador}
          />
        </View>
      ) : null}

      {ofertas.length > 0 ? (
        <>
          <Text style={styles.tituloSeccion}>Ofertas de la semana</Text>
          {ofertasFiltradas.length === 0 ? (
            <Text style={styles.sinResultados}>Sin resultados para "{busqueda}"</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaOfertas}>
              {ofertasFiltradas.map((oferta, indice) => (
                <EntradaAnimada key={oferta.nombre} retraso={indice * 60} style={styles.tarjetaOferta}>
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
                      <Text style={styles.precioAntes}>{formatearPrecio(oferta.precioOriginal, moneda)}</Text>
                    ) : null}
                    <Text style={styles.precioOferta}>{formatearPrecio(oferta.precio, moneda)}</Text>
                  </View>
                </EntradaAnimada>
              ))}
            </ScrollView>
          )}
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
    buscador: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.superficieHundida,
      borderRadius: radios.md,
      paddingHorizontal: espaciado.md,
      height: 40,
    },
    entradaBuscador: {
      flex: 1,
      ...tipografia.cuerpo,
      fontSize: 13,
      color: colores.texto,
      padding: 0,
    },
    sinResultados: {
      ...tipografia.cuerpo,
      color: colores.textoTenue,
      textAlign: "center",
      paddingVertical: espaciado.md,
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
