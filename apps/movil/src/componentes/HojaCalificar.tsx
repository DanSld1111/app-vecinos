import { useEffect, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calificacion } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { HojaInferior } from "./HojaInferior";

const VALORES: Calificacion[] = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

/** Redondea al medio punto más cercano y lo acota a [1, 5] — toca la mitad izquierda de una
 * estrella para X.0, la mitad derecha para X.5 (o X.0 de la siguiente, según dónde caiga). */
function calificacionDesdeToque(indiceEstrella: number, fraccionEnEstrella: number): Calificacion {
  const crudo = indiceEstrella + (fraccionEnEstrella < 0.5 ? 0.5 : 1);
  const redondeado = Math.round(crudo * 2) / 2;
  const acotado = Math.min(5, Math.max(0.5, redondeado)) as number;
  // Nunca 0 — la calificación mínima seleccionable es 1.
  return Math.max(1, acotado) as Calificacion;
}

function EstrellaSeleccionable({
  indice,
  valor,
  tamano,
  colorLleno,
  colorVacio,
  onTocar,
}: {
  indice: number;
  valor: number;
  tamano: number;
  colorLleno: string;
  colorVacio: string;
  onTocar: (indice: number, fraccion: number) => void;
}) {
  const relleno = Math.min(1, Math.max(0, valor - indice));
  const nombre = relleno >= 1 ? "star" : relleno >= 0.5 ? "star-half" : "star-outline";

  function alTocar(e: GestureResponderEvent) {
    const x = e.nativeEvent.locationX;
    onTocar(indice, x / tamano);
  }

  return (
    <Pressable onPress={alTocar} hitSlop={4} style={{ padding: 2 }}>
      <Ionicons name={nombre} size={tamano} color={relleno > 0 ? colorLleno : colorVacio} />
    </Pressable>
  );
}

export function HojaCalificar({
  visible,
  nombreNegocio,
  valorInicial,
  onCerrar,
  onCalificar,
}: {
  visible: boolean;
  nombreNegocio: string;
  /** Tu calificación anterior, si ya habías puesto una — arranca el selector marcado ahí. */
  valorInicial: Calificacion | null;
  onCerrar: () => void;
  onCalificar: (valor: Calificacion) => Promise<void>;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [valor, setValor] = useState<number>(valorInicial ?? 0);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState<Calificacion | null>(null);

  useEffect(() => {
    if (visible) {
      setValor(valorInicial ?? 0);
      setGuardado(null);
    }
  }, [visible, valorInicial]);

  async function alTocarEstrella(indice: number, fraccion: number) {
    const nuevo = calificacionDesdeToque(indice, fraccion);
    setValor(nuevo);
    setGuardando(true);
    try {
      await onCalificar(nuevo);
      setGuardado(nuevo);
    } finally {
      setGuardando(false);
    }
  }

  const TAMANO_ESTRELLA = 40;

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>¿Cómo calificas {nombreNegocio}?</Text>
        <View style={styles.filaEstrellas}>
          {[0, 1, 2, 3, 4].map((indice) => (
            <EstrellaSeleccionable
              key={indice}
              indice={indice}
              valor={valor}
              tamano={TAMANO_ESTRELLA}
              colorLleno="#e0a835"
              colorVacio={colores.borde}
              onTocar={alTocarEstrella}
            />
          ))}
        </View>
        {valor > 0 ? <Text style={styles.valorNumero}>{valor}</Text> : null}
        <Text style={styles.ayuda}>Toca la mitad izquierda o derecha de una estrella — medias estrellas incluidas.</Text>

        {guardando ? (
          <View style={styles.avisoGuardando}>
            <Text style={styles.avisoGuardandoTexto}>Guardando…</Text>
          </View>
        ) : guardado ? (
          <View style={styles.avisoGuardado}>
            <Ionicons name="checkmark-circle" size={14} color={colores.primarioFuerte} />
            <Text style={styles.avisoGuardadoTexto}>
              Guardaste {guardado} ✓ — puedes cambiarla cuando quieras
            </Text>
          </View>
        ) : null}
      </View>
    </HojaInferior>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      alignItems: "center",
      paddingBottom: espaciado.sm,
    },
    titulo: {
      ...tipografia.displaySeccion,
      fontSize: 15,
      color: colores.texto,
      textAlign: "center",
    },
    filaEstrellas: {
      flexDirection: "row",
      gap: 2,
      marginTop: espaciado.md,
    },
    valorNumero: {
      ...tipografia.titulo,
      fontSize: 17,
      color: colores.texto,
      marginTop: espaciado.xs,
    },
    ayuda: {
      ...tipografia.pie,
      fontSize: 10.5,
      color: colores.textoTenue,
      textAlign: "center",
      marginTop: espaciado.sm,
      marginBottom: espaciado.md,
    },
    avisoGuardando: {
      paddingVertical: espaciado.sm,
    },
    avisoGuardandoTexto: {
      ...tipografia.pie,
      color: colores.textoTenue,
    },
    avisoGuardado: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.xs,
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.md,
      paddingVertical: espaciado.sm,
      paddingHorizontal: espaciado.md,
    },
    avisoGuardadoTexto: {
      ...tipografia.pie,
      fontSize: 10.5,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.primarioFuerte,
      flexShrink: 1,
    },
  });
}
