import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { useSesion } from "../estado/useSesion";
import { useResenas, useResumenResenas, useMiResena, useInvalidarResenas } from "../datos/hooks/useResenas";
import { apiFetch, ErrorApi } from "../datos/api/clienteApi";
import { tiempoRelativo } from "../utilidades/tiempoRelativo";

function Estrellas({ valor, tamano = 16, color }: { valor: number; tamano?: number; color: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= valor ? "star" : "star-outline"} size={tamano} color={color} />
      ))}
    </View>
  );
}

function SelectorEstrellas({ valor, onCambiar, colores }: { valor: number; onCambiar: (v: number) => void; colores: PaletaColores }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onCambiar(n)} hitSlop={6}>
          <Ionicons name={n <= valor ? "star" : "star-outline"} size={28} color={colores.acento} />
        </Pressable>
      ))}
    </View>
  );
}

export function ResenasNegocio({ negocioId }: { negocioId: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const token = useSesion((estado) => estado.token);

  const { data: resumen } = useResumenResenas(negocioId);
  const { data: resenas, isLoading, isError } = useResenas(negocioId);
  const { data: miResena } = useMiResena(negocioId, token);
  const invalidar = useInvalidarResenas(negocioId);

  const [editando, setEditando] = useState(false);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function empezarEdicion() {
    setCalificacion(miResena?.calificacion ?? 5);
    setComentario(miResena?.comentario ?? "");
    setError(null);
    setEditando(true);
  }

  async function guardar() {
    if (!token) return;
    setEnviando(true);
    setError(null);
    try {
      await apiFetch("/resenas", {
        metodo: "POST",
        token,
        cuerpo: { negocioId, calificacion, comentario: comentario.trim() || undefined },
      });
      setEditando(false);
      invalidar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo guardar tu reseña.");
    } finally {
      setEnviando(false);
    }
  }

  async function eliminar() {
    if (!token || !miResena) return;
    setEnviando(true);
    try {
      await apiFetch(`/resenas/${miResena.id}`, { metodo: "DELETE", token });
      setEditando(false);
      invalidar();
    } catch {
      setError("No se pudo eliminar tu reseña.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezadoResumen}>
        <Text style={styles.promedio}>{resumen && resumen.total > 0 ? resumen.promedio.toFixed(1) : "—"}</Text>
        <View>
          <Estrellas valor={Math.round(resumen?.promedio ?? 0)} tamano={16} color={colores.acento} />
          <Text style={styles.totalTexto}>
            {resumen && resumen.total > 0 ? `${resumen.total} reseña${resumen.total === 1 ? "" : "s"}` : "Sin reseñas todavía"}
          </Text>
        </View>
      </View>

      {!token ? (
        <Text style={styles.avisoInvitado}>Inicia sesión con tu cuenta de vecino para dejar una reseña.</Text>
      ) : editando ? (
        <View style={styles.formulario}>
          <SelectorEstrellas valor={calificacion} onCambiar={setCalificacion} colores={colores} />
          <TextInput
            value={comentario}
            onChangeText={setComentario}
            placeholder="Cuéntale a tus vecinos qué tal tu experiencia (opcional)"
            placeholderTextColor={colores.textoTenue}
            multiline
            maxLength={500}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.filaBotones}>
            <Pressable style={[styles.boton, styles.botonPrimario]} onPress={guardar} disabled={enviando}>
              {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonPrimarioTexto}>Publicar</Text>}
            </Pressable>
            <Pressable style={styles.boton} onPress={() => setEditando(false)} disabled={enviando}>
              <Text style={styles.botonTexto}>Cancelar</Text>
            </Pressable>
            {miResena ? (
              <Pressable style={styles.boton} onPress={eliminar} disabled={enviando}>
                <Text style={[styles.botonTexto, { color: colores.error }]}>Eliminar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : (
        <Pressable style={styles.botonDejarResena} onPress={empezarEdicion}>
          <Ionicons name={miResena ? "create-outline" : "star-outline"} size={16} color={colores.primarioFuerte} />
          <Text style={styles.botonDejarResenaTexto}>{miResena ? "Editar tu reseña" : "Dejar una reseña"}</Text>
        </Pressable>
      )}

      {isLoading ? (
        <ActivityIndicator color={colores.primarioFuerte} style={{ marginTop: espaciado.md }} />
      ) : isError ? (
        <Text style={styles.avisoInvitado}>No pudimos cargar las reseñas. Intenta de nuevo más tarde.</Text>
      ) : resenas && resenas.length > 0 ? (
        <View style={{ gap: espaciado.sm, marginTop: espaciado.md }}>
          {resenas.map((r) => (
            <View key={r.id} style={styles.tarjetaResena}>
              <View style={styles.filaResenaEncabezado}>
                <Text style={styles.nombreResena}>{r.usuarioNombre}</Text>
                <Text style={styles.fechaResena}>{tiempoRelativo(r.creadoEn)}</Text>
              </View>
              <Estrellas valor={r.calificacion} tamano={13} color={colores.acento} />
              {r.comentario ? <Text style={styles.comentarioResena}>{r.comentario}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: { marginTop: espaciado.sm },
    encabezadoResumen: { flexDirection: "row", alignItems: "center", gap: espaciado.sm, marginBottom: espaciado.sm },
    promedio: { ...tipografia.titulo, color: colores.texto },
    totalTexto: { ...tipografia.pie, color: colores.textoTenue, marginTop: 2 },
    avisoInvitado: { ...tipografia.pie, color: colores.textoTenue, fontStyle: "italic" },
    botonDejarResena: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.xs,
      alignSelf: "flex-start",
      paddingVertical: espaciado.xs,
      paddingHorizontal: espaciado.sm,
      borderRadius: radios.sm,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    botonDejarResenaTexto: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.primarioFuerte },
    formulario: { gap: espaciado.sm },
    input: {
      ...tipografia.cuerpo,
      color: colores.texto,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: radios.sm,
      padding: espaciado.sm,
      minHeight: 70,
      textAlignVertical: "top",
    },
    error: { ...tipografia.pie, color: colores.error },
    filaBotones: { flexDirection: "row", gap: espaciado.sm },
    boton: { paddingVertical: espaciado.xs, paddingHorizontal: espaciado.sm, borderRadius: radios.sm },
    botonPrimario: { backgroundColor: colores.primarioFuerte },
    botonPrimarioTexto: { ...tipografia.cuerpoDestacado, fontSize: 13, color: "#fff" },
    botonTexto: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.textoSuave },
    tarjetaResena: {
      backgroundColor: colores.superficie,
      borderRadius: radios.sm,
      padding: espaciado.sm,
      gap: 4,
    },
    filaResenaEncabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    nombreResena: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.texto },
    fechaResena: { ...tipografia.pie, color: colores.textoTenue },
    comentarioResena: { ...tipografia.cuerpo, color: colores.textoSuave },
  });
}
