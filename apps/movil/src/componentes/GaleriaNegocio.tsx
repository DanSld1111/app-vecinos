import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { urlCompleta } from "../utilidades/media";

const TARJETAS_GALERIA: { icono: keyof typeof Ionicons.glyphMap; texto: string }[] = [
  { icono: "storefront-outline", texto: "Fachada del local" },
  { icono: "images-outline", texto: "Interior" },
  { icono: "pricetags-outline", texto: "Lo que ofrecen" },
  { icono: "people-outline", texto: "Atención al cliente" },
];

/** `fotos`: hasta 6 URLs subidas desde el panel (Mi negocio > Fotos). Los recuadros sin foto
 * propia siguen mostrando el ícono genérico — nunca se inventa una foto que el negocio no subió. */
export function GaleriaNegocio({ fotos = [] }: { fotos?: string[] }) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <View>
      <Text style={styles.tituloSeccion}>Fotos del negocio</Text>
      <View style={styles.grilla}>
        {TARJETAS_GALERIA.map((tarjeta, indice) => {
          const foto = fotos[indice];
          return (
            <View key={tarjeta.texto} style={styles.tarjeta}>
              {foto ? (
                <Image source={{ uri: urlCompleta(foto) }} style={styles.foto} />
              ) : (
                <>
                  <Ionicons name={tarjeta.icono} size={22} color={colores.textoTenue} />
                  <Text style={styles.texto}>{tarjeta.texto}</Text>
                </>
              )}
            </View>
          );
        })}
        {fotos.slice(4).map((foto, i) => (
          <View key={`extra-${i}`} style={styles.tarjeta}>
            <Image source={{ uri: urlCompleta(foto) }} style={styles.foto} />
          </View>
        ))}
      </View>
      {fotos.length === 0 ? (
        <Text style={styles.nota}>Fotos de ejemplo — el negocio podrá subir las suyas propias.</Text>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tituloSeccion: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
      marginTop: espaciado.md,
      marginBottom: espaciado.sm,
    },
    grilla: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
    },
    tarjeta: {
      width: "48%",
      aspectRatio: 1.3,
      borderRadius: radios.md,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
      gap: espaciado.xs,
      overflow: "hidden",
    },
    foto: {
      width: "100%",
      height: "100%",
    },
    texto: {
      ...tipografia.pie,
      color: colores.textoSuave,
      textAlign: "center",
    },
    nota: {
      ...tipografia.pie,
      fontSize: 11,
      color: colores.textoTenue,
      marginTop: espaciado.xs,
      fontStyle: "italic",
    },
  });
}
