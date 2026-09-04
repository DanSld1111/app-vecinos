import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../src/disenio";
import { useTema } from "../../src/estado/useTema";
import { useNotificaciones } from "../../src/estado/useNotificaciones";
import {
  GRUPOS_NOTIFICACION,
  obtenerCategoriasNotificacion,
} from "../../src/config/categoriasNotificacion";
import { Interruptor } from "../../src/componentes/Interruptor";

export default function AjustesNotificaciones() {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores);
  const categoriasNotificacion = obtenerCategoriasNotificacion(colores, modo === "oscuro");
  const preferencias = useNotificaciones((estado) => estado.preferencias);
  const alternarCategoria = useNotificaciones((estado) => estado.alternarCategoria);

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido}>
      <Text style={styles.titulo}>Notificaciones</Text>
      <Text style={styles.descripcion}>
        Elige qué avisos quieres recibir. Puedes cambiarlo cuando quieras.
      </Text>

      {GRUPOS_NOTIFICACION.map((grupo) => {
        const categorias = categoriasNotificacion.filter((c) => c.grupo === grupo.id);
        if (categorias.length === 0) return null;
        return (
          <View key={grupo.id} style={styles.grupo}>
            <Text style={styles.tituloGrupo}>{grupo.nombre}</Text>
            <View style={styles.sombra}>
              <View style={styles.tarjeta}>
                {categorias.map((categoria, i) => (
                  <View
                    key={categoria.id}
                    style={[styles.fila, i > 0 && styles.filaConBorde]}
                  >
                    <View style={[styles.icono, { backgroundColor: categoria.colorFondo }]}>
                      <Text style={styles.emoji}>{categoria.emoji}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.nombre}>{categoria.nombre}</Text>
                      <Text style={styles.descripcionFila}>{categoria.descripcion}</Text>
                    </View>
                    <Interruptor
                      activo={preferencias[categoria.id] ?? false}
                      onCambiar={() => alternarCategoria(categoria.id)}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      })}

      <View style={styles.avisoProximamente}>
        <Text style={styles.avisoProximamenteTexto}>
          ✉️ Los avisos por correo llegarán cuando la app tenga cuentas de usuario (próxima etapa) —
          por ahora todo se recibe por notificación dentro de la app.
        </Text>
      </View>
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenido: {
      padding: espaciado.lg,
      gap: espaciado.md,
    },
    titulo: {
      ...tipografia.displayGrande,
      color: colores.texto,
    },
    descripcion: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      marginTop: -espaciado.sm,
      marginBottom: espaciado.xs,
    },
    grupo: {
      gap: espaciado.sm,
    },
    tituloGrupo: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
    },
    sombra: {
      borderRadius: radios.lg,
      backgroundColor: colores.superficie,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    tarjeta: {
      borderRadius: radios.lg,
      overflow: "hidden",
    },
    fila: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      padding: espaciado.md,
    },
    filaConBorde: {
      borderTopWidth: 1,
      borderTopColor: colores.borde,
    },
    icono: {
      width: 36,
      height: 36,
      borderRadius: radios.md,
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
    descripcionFila: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    avisoProximamente: {
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.md,
      padding: espaciado.md,
      marginTop: espaciado.xs,
    },
    avisoProximamenteTexto: {
      ...tipografia.pie,
      color: colores.primarioFuerte,
      lineHeight: 17,
    },
  });
}
