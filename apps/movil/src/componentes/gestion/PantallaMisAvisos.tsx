import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Aviso, CategoriaAviso, Comunidad, Cuenta } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../disenio";
import { useTema } from "../../estado/useTema";
import { apiGet } from "../../datos/api/clienteApi";
import { useGestionAvisos } from "../../estado/useGestionAvisos";
import { estiloCategoria } from "../TarjetaAviso";

const CATEGORIAS_JUNTA: CategoriaAviso[] = ["junta_vecinal", "municipal", "otro"];

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function etiquetaEstado(
  colores: PaletaColores,
  oscuro: boolean
): Record<Aviso["estado"], { texto: string; color: string; fondo: string }> {
  return {
    publicado: { texto: "Publicado", color: colores.exito, fondo: colores.primarioSuave },
    pendiente: { texto: "En revisión", color: oscuro ? "#e0b565" : "#b8862e", fondo: oscuro ? "#3a3018" : "#f6ecd6" },
    rechazado: { texto: "Rechazado", color: colores.error, fondo: oscuro ? "#3a201c" : "#fbe2de" },
  };
}

type Vista = { tipo: "lista" } | { tipo: "nuevo" } | { tipo: "detalle"; id: string };

export function PantallaMisAvisos({ cuenta, token }: { cuenta: Cuenta; token: string }) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const oscuro = modo === "oscuro";
  const styles = crearEstilos(colores, oscuro);
  const avisos = useGestionAvisos((estado) => estado.avisos);
  const cargando = useGestionAvisos((estado) => estado.cargando);
  const error = useGestionAvisos((estado) => estado.error);
  const cargarPropios = useGestionAvisos((estado) => estado.cargarPropios);
  const enviarAValidacion = useGestionAvisos((estado) => estado.enviarAValidacion);
  const reenviarTrasRechazo = useGestionAvisos((estado) => estado.reenviarTrasRechazo);

  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [vista, setVista] = useState<Vista>({ tipo: "lista" });

  useEffect(() => {
    cargarPropios(token);
    apiGet<Comunidad[]>("/comunidades").then(setComunidades).catch(() => {});
  }, [cargarPropios, token]);

  const misAvisos = useMemo(() => [...avisos].sort((a, b) => b.publicadoEn.localeCompare(a.publicadoEn)), [avisos]);
  const comunidad = useMemo(
    () => comunidades.find((c) => cuenta.distritosAsignados.includes(c.distritoUbigeo)) ?? comunidades[0],
    [comunidades, cuenta],
  );
  const avisoEnDetalle = vista.tipo === "detalle" ? misAvisos.find((a) => a.id === vista.id) ?? null : null;

  if (vista.tipo === "nuevo") {
    return (
      <EditorAviso
        modo="nuevo"
        cuenta={cuenta}
        comunidadId={comunidad?.id ?? ""}
        onCancelar={() => setVista({ tipo: "lista" })}
        onGuardado={async (datos) => {
          // modo="nuevo" — EditorAviso siempre manda el objeto completo en este caso.
          const ok = await enviarAValidacion(datos as Parameters<typeof enviarAValidacion>[0], token);
          if (ok) setVista({ tipo: "lista" });
        }}
      />
    );
  }

  if (avisoEnDetalle?.estado === "rechazado") {
    return (
      <EditorAviso
        modo="corregir"
        cuenta={cuenta}
        comunidadId={comunidad?.id ?? ""}
        aviso={avisoEnDetalle}
        onCancelar={() => setVista({ tipo: "lista" })}
        onGuardado={async (datos) => {
          const ok = await reenviarTrasRechazo(avisoEnDetalle.id, datos, token);
          if (ok) setVista({ tipo: "lista" });
        }}
      />
    );
  }

  if (avisoEnDetalle) {
    return <DetalleAviso aviso={avisoEnDetalle} onVolver={() => setVista({ tipo: "lista" })} />;
  }

  const resumen = {
    total: misAvisos.length,
    publicados: misAvisos.filter((a) => a.estado === "publicado").length,
    pendientes: misAvisos.filter((a) => a.estado === "pendiente").length,
    rechazados: misAvisos.filter((a) => a.estado === "rechazado").length,
  };

  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={{ padding: espaciado.lg, paddingBottom: espaciado.xxl }}>
      <View style={styles.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Mis avisos</Text>
          <Text style={styles.subtitulo}>Se envían a validación antes de publicarse</Text>
        </View>
        <Pressable style={styles.botonNuevo} onPress={() => setVista({ tipo: "nuevo" })}>
          <Ionicons name="add" size={18} color="#fff" />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.cajaAlerta}>
          <Text style={styles.textoAlerta}>⚠️ {error}</Text>
        </View>
      ) : null}

      {cargando && misAvisos.length === 0 ? (
        <ActivityIndicator color={colores.primarioFuerte} style={{ marginTop: espaciado.xl }} />
      ) : (
        <>
          <View style={styles.filaResumen}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNumero}>{resumen.total}</Text>
              <Text style={styles.miniStatEtiqueta}>Total</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={[styles.miniStatNumero, { color: colores.exito }]}>{resumen.publicados}</Text>
              <Text style={styles.miniStatEtiqueta}>Publicados</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={[styles.miniStatNumero, { color: oscuro ? "#e0b565" : "#b8862e" }]}>{resumen.pendientes}</Text>
              <Text style={styles.miniStatEtiqueta}>En revisión</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={[styles.miniStatNumero, { color: colores.error }]}>{resumen.rechazados}</Text>
              <Text style={styles.miniStatEtiqueta}>Rechazados</Text>
            </View>
          </View>

          {misAvisos.length === 0 ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioTexto}>Todavía no has redactado ningún aviso.</Text>
            </View>
          ) : (
            <View style={{ gap: espaciado.sm }}>
              {misAvisos.map((aviso) => {
                const estiloCat = estiloCategoria(colores, oscuro)[aviso.categoria];
                const estiloEstado = etiquetaEstado(colores, oscuro)[aviso.estado];
                return (
                  <Pressable key={aviso.id} style={styles.filaAviso} onPress={() => setVista({ tipo: "detalle", id: aviso.id })}>
                    <View style={[styles.iconoCat, { backgroundColor: estiloCat.fondo }]}>
                      <Ionicons name={estiloCat.icono} size={17} color={estiloCat.texto} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.filaTitulo} numberOfLines={1}>{aviso.titulo}</Text>
                      <Text style={styles.filaCuerpo} numberOfLines={1}>{aviso.cuerpo}</Text>
                    </View>
                    <View style={[styles.pillEstado, { backgroundColor: estiloEstado.fondo }]}>
                      <Text style={[styles.pillEstadoTexto, { color: estiloEstado.color }]}>{estiloEstado.texto}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function DetalleAviso({ aviso, onVolver }: { aviso: Aviso; onVolver: () => void }) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const oscuro = modo === "oscuro";
  const styles = crearEstilos(colores, oscuro);
  const estilo = estiloCategoria(colores, oscuro)[aviso.categoria];
  const esPublicado = aviso.estado === "publicado";
  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={{ padding: espaciado.lg, paddingBottom: espaciado.xxl }}>
      <Pressable style={styles.volver} onPress={onVolver}>
        <Ionicons name="chevron-back" size={18} color={colores.textoSuave} />
        <Text style={styles.volverTexto}>Mis avisos</Text>
      </Pressable>

      <Text style={styles.titulo}>{aviso.titulo}</Text>
      <Text style={styles.subtitulo}>{esPublicado ? `Publicado el ${formatearFecha(aviso.publicadoEn)}` : `Enviado el ${formatearFecha(aviso.publicadoEn)}`}</Text>

      <View style={[styles.cajaNota, esPublicado ? styles.cajaNotaExito : styles.cajaNotaEspera]}>
        <Text style={[styles.textoNota, { color: esPublicado ? colores.primarioFuerte : (oscuro ? "#e0b565" : "#b8862e") }]}>
          {esPublicado
            ? "✅ Este aviso ya está publicado y visible para los vecinos."
            : "⏳ En revisión por el equipo ELISUR. Te avisaremos apenas quede aprobado o si hay algo que corregir."}
        </Text>
      </View>

      <View style={styles.tarjetaDetalle}>
        <View style={[styles.iconoCatGrande, { backgroundColor: estilo.fondo }]}>
          <Ionicons name={estilo.icono} size={20} color={estilo.texto} />
        </View>
        <Text style={styles.filaTitulo}>{aviso.titulo}</Text>
        <Text style={styles.cuerpoDetalle}>{aviso.cuerpo}</Text>
      </View>

      {esPublicado ? (
        <View style={styles.filaResumen}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatNumero}>{aviso.meGusta}</Text>
            <Text style={styles.miniStatEtiqueta}>Vecinos interesados</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatNumero}>{aviso.compartidos}</Text>
            <Text style={styles.miniStatEtiqueta}>Compartido</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function EditorAviso({
  modo,
  cuenta,
  comunidadId,
  aviso,
  onCancelar,
  onGuardado,
}: {
  modo: "nuevo" | "corregir";
  cuenta: Cuenta;
  comunidadId: string;
  aviso?: Aviso;
  onCancelar: () => void;
  onGuardado: (
    datos:
      | { comunidadId: string; fuenteNombre: string; titulo: string; cuerpo: string; categoria: CategoriaAviso }
      | { titulo: string; cuerpo: string; categoria: CategoriaAviso },
  ) => void;
}) {
  const colores = useColores();
  const modoTema = useTema((estado) => estado.modo);
  const oscuro = modoTema === "oscuro";
  const styles = crearEstilos(colores, oscuro);
  const [categoria, setCategoria] = useState<CategoriaAviso>(aviso?.categoria ?? "junta_vecinal");
  const [titulo, setTitulo] = useState(aviso?.titulo ?? "");
  const [cuerpo, setCuerpo] = useState(aviso?.cuerpo ?? "");
  const cargando = useGestionAvisos((estado) => estado.cargando);
  const error = useGestionAvisos((estado) => estado.error);

  const valido = Boolean(titulo.trim() && cuerpo.trim() && comunidadId);

  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={{ padding: espaciado.lg, paddingBottom: espaciado.xxl }}>
      <Pressable style={styles.volver} onPress={onCancelar}>
        <Ionicons name="chevron-back" size={18} color={colores.textoSuave} />
        <Text style={styles.volverTexto}>{modo === "nuevo" ? "Cancelar" : "Mis avisos"}</Text>
      </Pressable>

      <Text style={styles.titulo}>{modo === "nuevo" ? "Nuevo aviso" : "Corregir aviso rechazado"}</Text>
      <Text style={styles.subtitulo}>
        {modo === "nuevo" ? "Se envía a validación — el equipo ELISUR lo revisa antes de publicarlo" : "Ajusta lo que se indica y vuelve a enviarlo"}
      </Text>

      {modo === "corregir" && aviso ? (
        <View style={[styles.cajaNota, styles.cajaNotaError]}>
          <Text style={[styles.textoNota, { color: colores.error }]}>✕ Motivo del rechazo: "{aviso.motivoRechazo}"</Text>
        </View>
      ) : (
        <View style={[styles.cajaNota, styles.cajaNotaEspera]}>
          <Text style={[styles.textoNota, { color: oscuro ? "#e0b565" : "#b8862e" }]}>
            ℹ️ Tu nombre de fuente aparece sin la insignia de verificado — esa insignia es solo para fuentes oficiales.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Categoría</Text>
      <View style={{ gap: espaciado.sm, marginBottom: espaciado.md }}>
        {CATEGORIAS_JUNTA.map((cat) => {
          const estilo = estiloCategoria(colores, oscuro)[cat];
          const seleccionado = categoria === cat;
          return (
            <Pressable
              key={cat}
              style={[styles.opcionCategoria, seleccionado && styles.opcionCategoriaSel]}
              onPress={() => setCategoria(cat)}
            >
              <View style={[styles.iconoCat, { backgroundColor: estilo.fondo }]}>
                <Ionicons name={estilo.icono} size={16} color={estilo.texto} />
              </View>
              <Text style={styles.opcionCategoriaTexto}>{estilo.etiqueta}</Text>
              {seleccionado ? <Ionicons name="checkmark-circle" size={18} color={colores.primario} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Título</Text>
      <View style={styles.campo}>
        <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Ej. Reunión extraordinaria — Sector 4" placeholderTextColor={colores.textoTenue} />
      </View>

      <Text style={[styles.label, { marginTop: espaciado.md }]}>Descripción</Text>
      <View style={styles.campo}>
        <TextInput
          style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
          value={cuerpo}
          onChangeText={(v) => setCuerpo(v.slice(0, 400))}
          placeholder="Ej. Este jueves 3 de septiembre, 7:00 p.m., local comunal."
          placeholderTextColor={colores.textoTenue}
          multiline
        />
      </View>
      <Text style={styles.contador}>{cuerpo.length} / 400 caracteres</Text>

      {error ? (
        <View style={styles.cajaAlerta}>
          <Text style={styles.textoAlerta}>⚠️ {error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.boton, { opacity: valido && !cargando ? 1 : 0.45, marginTop: espaciado.lg }]}
        onPress={() => {
          if (!valido) return;
          // "corregir" llama a PATCH /avisos/:id/reenviar, cuyo DTO solo acepta titulo/cuerpo/categoria
          // (comunidadId y fuenteNombre no cambian al corregir un rechazo) — mandarlos igual hace que
          // el servidor rechace la petición ("property comunidadId should not exist").
          if (modo === "corregir") {
            onGuardado({ titulo: titulo.trim(), cuerpo: cuerpo.trim(), categoria });
            return;
          }
          onGuardado({ comunidadId, fuenteNombre: cuenta.nombre, titulo: titulo.trim(), cuerpo: cuerpo.trim(), categoria });
        }}
      >
        <Text style={styles.botonTexto}>{cargando ? "Enviando…" : modo === "nuevo" ? "Enviar a validación" : "Reenviar a validación"}</Text>
      </Pressable>
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores, oscuro: boolean) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.superficieHundida },
    cabecera: { flexDirection: "row", alignItems: "flex-start", marginBottom: espaciado.lg },
    titulo: { ...tipografia.displayGrande, fontSize: 21, color: colores.texto },
    subtitulo: { ...tipografia.cuerpo, color: colores.textoSuave, marginTop: 3, marginBottom: espaciado.md },
    botonNuevo: { width: 38, height: 38, borderRadius: radios.md, backgroundColor: colores.texto, alignItems: "center", justifyContent: "center" },
    volver: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: espaciado.lg },
    volverTexto: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.textoSuave },

    filaResumen: { flexDirection: "row", flexWrap: "wrap", gap: espaciado.sm, marginBottom: espaciado.lg },
    miniStat: { flex: 1, minWidth: 78, backgroundColor: colores.superficie, borderRadius: radios.md, padding: espaciado.md, gap: 2 },
    miniStatNumero: { ...tipografia.titulo, fontSize: 20, color: colores.texto },
    miniStatEtiqueta: { ...tipografia.pie, fontSize: 10.5, color: colores.textoTenue },

    vacio: { backgroundColor: colores.superficie, borderRadius: radios.lg, padding: espaciado.xl, alignItems: "center" },
    vacioTexto: { ...tipografia.cuerpo, color: colores.textoTenue },

    filaAviso: { flexDirection: "row", alignItems: "center", gap: espaciado.md, backgroundColor: colores.superficie, borderRadius: radios.lg, padding: espaciado.md },
    iconoCat: { width: 34, height: 34, borderRadius: radios.sm, alignItems: "center", justifyContent: "center" },
    iconoCatGrande: { width: 42, height: 42, borderRadius: radios.md, alignItems: "center", justifyContent: "center", marginBottom: espaciado.sm },
    filaTitulo: { ...tipografia.cuerpoDestacado, color: colores.texto },
    filaCuerpo: { ...tipografia.pie, color: colores.textoSuave },
    pillEstado: { paddingHorizontal: espaciado.sm, paddingVertical: 4, borderRadius: radios.completo },
    pillEstadoTexto: { ...tipografia.pie, fontSize: 10.5, fontFamily: "PlusJakartaSans_700Bold" },

    cajaNota: { borderRadius: radios.md, padding: espaciado.md, marginBottom: espaciado.lg },
    cajaNotaExito: { backgroundColor: colores.primarioSuave },
    cajaNotaEspera: { backgroundColor: oscuro ? "#3a3018" : "#f6ecd6" },
    cajaNotaError: { backgroundColor: oscuro ? "#3a201c" : "#fbe2de" },
    textoNota: { ...tipografia.pie, lineHeight: 17 },

    tarjetaDetalle: { backgroundColor: colores.superficie, borderRadius: radios.lg, padding: espaciado.lg, marginBottom: espaciado.lg },
    cuerpoDetalle: { ...tipografia.cuerpo, color: colores.textoSuave, marginTop: 6, lineHeight: 20 },

    label: { ...tipografia.etiqueta, color: colores.textoSuave, marginBottom: espaciado.xs },
    campo: { borderWidth: 1.5, borderColor: colores.borde, borderRadius: radios.md, paddingHorizontal: espaciado.md, paddingVertical: espaciado.sm + 2, backgroundColor: colores.superficie },
    input: { ...tipografia.cuerpoDestacado, color: colores.texto },
    contador: { ...tipografia.pie, fontSize: 10.5, color: colores.textoTenue, textAlign: "right", marginTop: 4 },

    opcionCategoria: { flexDirection: "row", alignItems: "center", gap: espaciado.sm, borderWidth: 1.5, borderColor: colores.borde, borderRadius: radios.md, padding: espaciado.sm + 2, backgroundColor: colores.superficie },
    opcionCategoriaSel: { borderColor: colores.primario },
    opcionCategoriaTexto: { ...tipografia.cuerpoDestacado, color: colores.texto, flex: 1 },

    boton: { height: 46, borderRadius: radios.md, alignItems: "center", justifyContent: "center", backgroundColor: colores.texto },
    botonTexto: { ...tipografia.cuerpoDestacado, color: "#fff" },

    cajaAlerta: { backgroundColor: oscuro ? "#3a201c" : "#fbe2de", borderRadius: radios.md, padding: espaciado.sm + 2, marginBottom: espaciado.md },
    textoAlerta: { ...tipografia.pie, color: colores.error },
  });
}
