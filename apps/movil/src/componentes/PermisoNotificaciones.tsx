import { Modal, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { BotonPrimario } from "./BotonPrimario";
import { useNotificaciones } from "../estado/useNotificaciones";

const FOTO = require("../../assets/servicios/supermarket.jpg");

/**
 * Se pide permiso de avisos la primera vez que se toca la campana — con una foto y diciendo qué
 * se va a recibir antes de pedir el sí (antes: un emoji de campana sobre fondo blanco).
 */
export function PermisoNotificaciones({
  visible,
  onCerrar,
}: {
  visible: boolean;
  onCerrar: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const decidir = useNotificaciones((estado) => estado.decidir);

  function activar() {
    void decidir(true);
    onCerrar();
  }

  function ahoraNo() {
    void decidir(false);
    onCerrar();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={ahoraNo}>
      <View style={styles.fondo}>
        <View style={styles.tarjeta} accessibilityViewIsModal>
          <View style={styles.foto}>
            <Image source={FOTO} style={styles.imagen} contentFit="cover" />
            <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
            <Ionicons name="notifications-outline" size={26} color="#ffffff" style={styles.campana} />
          </View>
          <View style={styles.cuerpo}>
            <Text style={styles.titulo} accessibilityRole="header">
              Entérate de las ofertas y avisos de tu comunidad
            </Text>
            <Text style={styles.texto}>
              Alertas de seguridad, cortes de servicio y ofertas cerca de ti. Tú eliges cuáles, y puedes cambiarlo
              cuando quieras desde tu perfil.
            </Text>
            <BotonPrimario texto="Activar avisos" onPress={activar} />
            <BotonPrimario texto="Ahora no" onPress={ahoraNo} variante="fantasma" style={{ marginTop: espaciado.sm }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    fondo: {
      flex: 1,
      backgroundColor: "rgba(10, 14, 12, 0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: espaciado.lg,
    },
    tarjeta: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: colores.fondo,
    },
    foto: { height: 140, overflow: "hidden", backgroundColor: colores.superficieHundida2 },
    imagen: { width: "100%", height: 140 },
    campana: { position: "absolute", left: espaciado.lg, bottom: espaciado.md },
    cuerpo: { padding: espaciado.lg },
    titulo: { ...tipografia.titulo, fontSize: 21, lineHeight: 25, color: colores.texto },
    texto: { ...tipografia.cuerpo, color: colores.textoSuave, marginTop: espaciado.sm, marginBottom: espaciado.lg },
  });
}
