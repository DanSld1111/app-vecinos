import { Ionicons } from "@expo/vector-icons";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";

export function VisorImagen({
  uri,
  visible,
  onCerrar,
}: {
  uri: string | null;
  visible: boolean;
  onCerrar: () => void;
}) {
  if (!uri) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <Pressable style={styles.cerrar} onPress={onCerrar} hitSlop={12}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
        <Pressable style={styles.contenedorImagen} onPress={onCerrar}>
          <Image source={{ uri }} style={styles.imagen} resizeMode="contain" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(10,14,10,0.95)",
    justifyContent: "center",
  },
  cerrar: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  contenedorImagen: {
    flex: 1,
  },
  imagen: {
    flex: 1,
  },
});
