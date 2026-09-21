import { StyleSheet, Text, View } from "react-native";
import { Moneda, ServicioOfrecido, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { useTema } from "../estado/useTema";

const EMOJI_POR_SERVICIO: Record<string, string> = {
  "Lavado y secado": "🧺",
  "Planchado": "👔",
  "Edredón / cobertor": "🛏️",
  "Consulta general": "🩺",
  "Vacunación": "💉",
  "Baño y corte": "✂️",
};

export function ServiciosNegocio({ servicios, moneda }: { servicios: ServicioOfrecido[]; moneda: Moneda }) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores, modo === "oscuro");

  if (servicios.length === 0) return null;

  return (
    <View>
      <Text style={styles.tituloSeccion}>Servicios y tarifas</Text>
      {servicios.map((servicio) => (
        <View key={servicio.nombre} style={styles.fila}>
          <View style={styles.icono}>
            <Text style={styles.emoji}>{EMOJI_POR_SERVICIO[servicio.nombre] ?? "🏷️"}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.nombre}>{servicio.nombre}</Text>
            {servicio.detalle ? <Text style={styles.detalle}>{servicio.detalle}</Text> : null}
          </View>
          <Text style={styles.precio}>{formatearPrecio(servicio.precio, moneda)}</Text>
        </View>
      ))}
      <Text style={styles.nota}>Tarifas referenciales — confirma el precio final con el negocio.</Text>
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
    fila: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      paddingVertical: espaciado.sm,
      borderTopWidth: 1,
      borderTopColor: colores.borde,
    },
    icono: {
      width: 34,
      height: 34,
      borderRadius: radios.sm,
      // Azul de servicio — decorativo, distinto de marca a propósito (ver OfertasPasillosNegocio.tsx).
      backgroundColor: oscuro ? "#1c2c38" : "#dbe9f1",
      alignItems: "center",
      justifyContent: "center",
    },
    emoji: {
      fontSize: 16,
    },
    info: {
      flex: 1,
    },
    nombre: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
    },
    detalle: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    precio: {
      ...tipografia.cuerpoDestacado,
      color: colores.primarioFuerte,
    },
    nota: {
      ...tipografia.pie,
      fontSize: 11,
      color: colores.textoTenue,
      fontStyle: "italic",
      marginTop: espaciado.sm,
    },
  });
}
