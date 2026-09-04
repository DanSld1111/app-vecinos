import { Modal, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { BotonPrimario } from "./BotonPrimario";
import { useNotificaciones } from "../estado/useNotificaciones";

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
        <View style={styles.tarjeta}>
          <View style={styles.icono}>
            <Text style={{ fontSize: 26 }}>🔔</Text>
          </View>
          <Text style={styles.titulo}>Activa las notificaciones</Text>
          <Text style={styles.texto}>
            Entérate al instante de ofertas de negocios de tu comunidad y novedades importantes.
            Puedes desactivarlo cuando quieras desde Mi perfil.
          </Text>
          <BotonPrimario texto="Activar notificaciones" onPress={activar} style={styles.boton} />
          <BotonPrimario texto="Ahora no" onPress={ahoraNo} variante="fantasma" />
        </View>
      </View>
    </Modal>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    fondo: {
      flex: 1,
      backgroundColor: colores.fondo,
      alignItems: "center",
      justifyContent: "center",
      padding: espaciado.xl,
    },
    tarjeta: {
      width: "100%",
      maxWidth: 320,
      alignItems: "center",
      gap: espaciado.sm,
    },
    icono: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colores.acentoSuave,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: espaciado.sm,
    },
    titulo: {
      ...tipografia.titulo,
      fontSize: 20,
      color: colores.texto,
      textAlign: "center",
    },
    texto: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      textAlign: "center",
      marginBottom: espaciado.md,
    },
    boton: {
      width: "100%",
      marginBottom: espaciado.sm,
    },
  });
}
