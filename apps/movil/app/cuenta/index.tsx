import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { useSesionCuenta } from "../../src/estado/useSesionCuenta";
import { LoginCuenta } from "../../src/componentes/gestion/LoginCuenta";
import { PantallaMiNegocio } from "../../src/componentes/gestion/PantallaMiNegocio";
import { PantallaMisAvisos } from "../../src/componentes/gestion/PantallaMisAvisos";

/**
 * Entrada del "modo gestión" — dueño de negocio y junta vecinal publican
 * contenido real desde acá, con su propia cuenta (la misma que usan en el
 * panel de administración). No usa la sesión de vecino (`useSesion`).
 */
export default function PantallaCuenta() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const cuenta = useSesionCuenta((estado) => estado.cuenta);
  const token = useSesionCuenta((estado) => estado.token);
  const cerrarSesion = useSesionCuenta((estado) => estado.cerrarSesion);

  const volver = () => (router.canGoBack() ? router.back() : router.replace("/perfil"));

  if (!cuenta || !token) {
    return <LoginCuenta onCerrar={volver} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <View style={styles.barra}>
        <Pressable style={styles.volver} onPress={volver} hitSlop={8}>
          <Ionicons name="close" size={20} color={colores.textoSuave} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.nombreCuenta}>{cuenta.nombre}</Text>
          <Text style={styles.rolCuenta}>{cuenta.rol === "dueno_negocio" ? "Dueño de negocio" : "Junta vecinal"}</Text>
        </View>
        <Pressable onPress={cerrarSesion} hitSlop={8}>
          <Text style={styles.salir}>Salir</Text>
        </Pressable>
      </View>

      {cuenta.rol === "dueno_negocio" ? <PantallaMiNegocio cuenta={cuenta} token={token} /> : null}
      {cuenta.rol === "junta_vecinal" ? <PantallaMisAvisos cuenta={cuenta} token={token} /> : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    barra: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      paddingHorizontal: espaciado.lg,
      paddingTop: espaciado.md,
      paddingBottom: espaciado.sm,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
    },
    volver: { padding: 2 },
    nombreCuenta: { ...tipografia.cuerpoDestacado, color: colores.texto },
    rolCuenta: { ...tipografia.pie, color: colores.textoTenue },
    salir: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.acentoFuerte },
  });
}
