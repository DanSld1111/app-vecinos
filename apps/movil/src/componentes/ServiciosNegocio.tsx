import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import { Moneda, ServicioOfrecido, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { useTema } from "../estado/useTema";
import { urlCompleta } from "../utilidades/media";
import { EntradaAnimada } from "./EntradaAnimada";

// Ícono de línea por servicio conocido; el resto usa una etiqueta genérica (antes eran emojis).
const ICONO_POR_SERVICIO: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Lavado y secado": "water-outline",
  "Planchado": "shirt-outline",
  "Edredón / cobertor": "bed-outline",
  "Consulta general": "medkit-outline",
  "Vacunación": "bandage-outline",
  "Baño y corte": "cut-outline",
};

export function ServiciosNegocio({
  servicios,
  moneda,
  busqueda = "",
  titulo = "Servicios y tarifas",
}: {
  /** Título de la sección: el que configuró la categoría en el panel, o el de la ficha. */
  titulo?: string;
  servicios: ServicioOfrecido[];
  moneda: Moneda;
  /** Viene del buscador del header de la ficha — ver app/negocio/[id]/index.tsx. */
  busqueda?: string;
}) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores, modo === "oscuro");

  if (servicios.length === 0) return null;
  const termino = busqueda.trim().toLowerCase();
  const filtrados = termino ? servicios.filter((s) => s.nombre.toLowerCase().includes(termino)) : servicios;

  if (filtrados.length === 0) {
    return (
      <View>
        <Text style={styles.tituloSeccion}>{titulo}</Text>
        <Text style={styles.sinResultados}>Sin resultados para "{busqueda}"</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.tituloSeccion}>{titulo}</Text>
      {filtrados.map((servicio, indice) => (
        <EntradaAnimada key={servicio.nombre} retraso={indice * 60} style={styles.fila}>
          {servicio.fotoUrl ? (
            <Image source={{ uri: urlCompleta(servicio.fotoUrl) }} style={styles.foto} />
          ) : (
            <View style={styles.icono}>
              <Ionicons name={ICONO_POR_SERVICIO[servicio.nombre] ?? "pricetag-outline"} size={18} color={colores.primario} />
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.nombre}>{servicio.nombre}</Text>
            {servicio.detalle ? <Text style={styles.detalle}>{servicio.detalle}</Text> : null}
          </View>
          <Text style={styles.precio}>{servicio.precio === 0 ? "Gratis" : formatearPrecio(servicio.precio, moneda)}</Text>
        </EntradaAnimada>
      ))}
      <Text style={styles.nota}>Tarifas referenciales. Confirma el precio final con el negocio.</Text>
    </View>
  );
}

function crearEstilos(colores: PaletaColores, oscuro: boolean) {
  return StyleSheet.create({
    tituloSeccion: {
      ...tipografia.subtitulo,
      color: colores.texto,
      marginTop: espaciado.lg,
      marginBottom: espaciado.xs,
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
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
    emoji: {
      fontSize: 16,
    },
    foto: {
      width: 34,
      height: 34,
      borderRadius: radios.sm,
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
    sinResultados: {
      ...tipografia.cuerpo,
      color: colores.textoTenue,
      textAlign: "center",
      paddingVertical: espaciado.lg,
    },
  });
}
