import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ETIQUETA_ESTADO_PADRINAZGO, ETIQUETA_ESTADO_SOLICITUD, EstadoSolicitudAdopcion, Padrinazgo, SolicitudAdopcion } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { cancelarPadrinazgo, cancelarSolicitud, cerrarAviso, useActividadRescate, useRefrescarRescate } from "../../src/datos/hooks/useRescate";
import { useSesion } from "../../src/estado/useSesion";
import { urlCompleta } from "../../src/utilidades/media";
import { abrirWhatsapp } from "../../src/utilidades/whatsapp";
import { BotonRescate, Cabecera, PedirSesion, ROJO_AVISO, Segmentos, TarjetaAviso, hace } from "../../src/componentes/rescate/comun";
import { mensajeSolicitud } from "../../src/componentes/rescate/mensajes";

type Pestana = "solicitudes" | "padrinazgos" | "avisos";

const ETAPAS: { estados: EstadoSolicitudAdopcion[]; nombre: string; detalle: string }[] = [
  { estados: ["nueva", "entrevista", "aprobada", "adoptada"], nombre: "Solicitud enviada", detalle: "El albergue ya la tiene" },
  { estados: ["entrevista", "aprobada", "adoptada"], nombre: "Entrevista con el albergue", detalle: "Te contactan por WhatsApp" },
  { estados: ["aprobada", "adoptada"], nombre: "Aprobada: la conoces", detalle: "Coordinan la visita al albergue" },
  { estados: ["adoptada"], nombre: "¡A casa!", detalle: "Visita al hogar y entrega" },
];

const COLOR_ESTADO: Record<string, [string, string]> = {
  nueva: ["#dbf1e3", "#123d13"],
  entrevista: ["#fdf0d9", "#6b4a0e"],
  aprobada: ["#dbf1e3", "#123d13"],
  adoptada: ["#dbf1e3", "#123d13"],
  no_aprobada: ["#eef1ee", "#3c4640"],
  cancelada: ["#eef1ee", "#3c4640"],
  por_confirmar: ["#fdf0d9", "#6b4a0e"],
  activo: ["#dbf1e3", "#123d13"],
  atrasado: ["#fdeee8", "#8f2a16"],
  cancelado: ["#eef1ee", "#3c4640"],
};

/** Lo que el vecino tiene en curso en Rescate animal (decisión 0097). */
export default function MiActividad() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const token = useSesion((e) => e.token);
  const { data, isLoading } = useActividadRescate();
  const refrescar = useRefrescarRescate();
  const [pestana, setPestana] = useState<Pestana>("solicitudes");
  const [trabajando, setTrabajando] = useState<string | null>(null);

  async function hacer(id: string, fn: () => Promise<unknown>) {
    setTrabajando(id);
    try {
      await fn();
      await refrescar();
    } finally {
      setTrabajando(null);
    }
  }

  const pistas = (data?.avisos ?? []).filter((a) => a.estado !== "cerrado").reduce((s, a) => s + a.pistas, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Cabecera titulo="Mi actividad" subtitulo="Rescate animal" />
      {!token ? (
        <View style={{ padding: espaciado.lg }}>
          <PedirSesion texto="Inicia sesión para ver tus solicitudes, padrinazgos y avisos." />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: espaciado.lg, gap: 12, paddingBottom: insets.bottom + 40 }}>
          <Segmentos<Pestana>
            etiqueta="Qué ver"
            valor={pestana}
            onCambiar={setPestana}
            opciones={[
              { id: "solicitudes", texto: "Solicitudes" },
              { id: "padrinazgos", texto: "Padrinazgos" },
              { id: "avisos", texto: pistas ? `Mis avisos (${pistas})` : "Mis avisos" },
            ]}
          />
          {isLoading ? <ActivityIndicator color={colores.primario} /> : null}

          {pestana === "solicitudes" && data ? (
            data.solicitudes.length ? (
              data.solicitudes.map((s) => <TarjetaSolicitud key={s.id} s={s} trabajando={trabajando === s.id} onCancelar={() => token && hacer(s.id, () => cancelarSolicitud(s.id, token))} />)
            ) : (
              <Vacio texto="Todavía no pediste adoptar. Cuando lo hagas, aquí verás en qué paso va." accion="Ver mascotas en adopción" onAccion={() => router.replace("/servicios/rescate-animal")} />
            )
          ) : null}

          {pestana === "padrinazgos" && data ? (
            data.padrinazgos.length ? (
              data.padrinazgos.map((p) => <TarjetaPadrinazgo key={p.id} p={p} trabajando={trabajando === p.id} onCancelar={() => token && hacer(p.id, () => cancelarPadrinazgo(p.id, token))} />)
            ) : (
              <Vacio texto="Todavía no apadrinas a ninguna mascota. Con un aporte al mes cubres su comida y medicinas." accion="Ver cómo ayudar" onAccion={() => router.push("/rescate/ayudar")} />
            )
          ) : null}

          {pestana === "avisos" && data ? (
            <>
              {data.avisos.map((a) => (
                <View key={a.id} style={{ gap: 8 }}>
                  <TarjetaAviso a={a} onPress={() => router.push(`/rescate/aviso/${a.id}`)} />
                  {a.estado === "cerrado" ? (
                    <Text style={styles.cerrado}>{a.tipo === "perdido" ? "Volvió a casa" : "Cerrado"} {a.cerradoEn ? hace(a.cerradoEn) : ""}</Text>
                  ) : (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <BotonRescate texto="Ver pistas" tipo="secundario" style={{ flex: 1, minHeight: 44 }} onPress={() => router.push(`/rescate/aviso/${a.id}`)} />
                      <BotonRescate
                        texto={trabajando === a.id ? "Guardando…" : a.tipo === "perdido" ? "Ya volvió a casa" : "Ya apareció su familia"}
                        style={{ flex: 1, minHeight: 44 }}
                        deshabilitado={trabajando === a.id}
                        onPress={() => token && hacer(a.id, () => cerrarAviso(a.id, token))}
                      />
                    </View>
                  )}
                  {a.estado === "oculto" ? <Text style={[styles.cerrado, { color: ROJO_AVISO }]}>Oculto mientras ELISUR lo revisa (recibió reportes).</Text> : null}
                </View>
              ))}
              <BotonRescate texto="+ Reportar otra mascota" tipo="secundario" onPress={() => router.push("/rescate/reportar")} />
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Vacio({ texto, accion, onAccion }: { texto: string; accion: string; onAccion: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.vacio}>
      <Text style={styles.nota}>{texto}</Text>
      <BotonRescate texto={accion} tipo="secundario" onPress={onAccion} />
    </View>
  );
}

function Estado({ estado, texto }: { estado: string; texto: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [fondo, color] = COLOR_ESTADO[estado] ?? ["#eef1ee", "#3c4640"];
  return <Text style={[styles.estado, { backgroundColor: fondo, color }]}>{texto}</Text>;
}

function TarjetaSolicitud({ s, trabajando, onCancelar }: { s: SolicitudAdopcion; trabajando: boolean; onCancelar: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const abierta = ["nueva", "entrevista", "aprobada"].includes(s.estado);
  const enCurso = abierta || s.estado === "adoptada";
  return (
    <View style={styles.tarjeta}>
      <View style={styles.cabeza}>
        {s.mascotaFotoUrl ? <Image source={{ uri: urlCompleta(s.mascotaFotoUrl) }} style={styles.foto} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Adoptar a {s.mascotaNombre}</Text>
          <Text style={styles.nota}>
            N.º {s.numero} · {s.albergueNombre} · {hace(s.creadoEn)}
          </Text>
        </View>
        <Estado estado={s.estado} texto={ETIQUETA_ESTADO_SOLICITUD[s.estado]} />
      </View>
      {enCurso ? (
        <View>
          {ETAPAS.map((e, i) => {
            const hecha = e.estados.includes(s.estado);
            return (
              <View key={e.nombre} style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ width: 22, alignItems: "center" }}>
                  <View style={[styles.punto, hecha && { backgroundColor: colores.primario, borderColor: colores.primario }]} />
                  {i < ETAPAS.length - 1 ? <View style={[styles.linea, hecha && { backgroundColor: colores.primario }]} /> : null}
                </View>
                <View style={{ paddingBottom: 10, flex: 1 }}>
                  <Text style={[styles.etapa, !hecha && { color: colores.textoSuave }]}>{e.nombre}</Text>
                  <Text style={styles.nota}>{e.detalle}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.nota}>{s.estado === "cancelada" ? "Cancelaste esta solicitud." : "Esta vez no se pudo. Hay más mascotas esperando un hogar."}</Text>
      )}
      {abierta ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {s.albergueWhatsapp ? <BotonRescate texto="Escribir al albergue" style={{ flex: 1, minHeight: 44 }} onPress={() => abrirWhatsapp(s.albergueWhatsapp, mensajeSolicitud(s))} /> : null}
          <BotonRescate texto={trabajando ? "…" : "Cancelar"} tipo="secundario" style={{ flex: 1, minHeight: 44 }} deshabilitado={trabajando} onPress={onCancelar} />
        </View>
      ) : null}
    </View>
  );
}

function TarjetaPadrinazgo({ p, trabajando, onCancelar }: { p: Padrinazgo; trabajando: boolean; onCancelar: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const desde = new Date(p.ultimoPagoEn ?? p.creadoEn);
  const proximo = new Date(desde.getTime() + 30 * 86_400_000).toLocaleDateString("es-PE", { day: "numeric", month: "long" });
  return (
    <View style={styles.tarjeta}>
      <View style={styles.cabeza}>
        {p.mascotaFotoUrl ? <Image source={{ uri: urlCompleta(p.mascotaFotoUrl) }} style={styles.foto} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>
            {p.mascotaNombre} · S/ {p.monto} al mes
          </Text>
          <Text style={styles.nota}>
            N.º {p.numero} · {p.albergueNombre}
          </Text>
        </View>
        <Estado estado={p.estado} texto={ETIQUETA_ESTADO_PADRINAZGO[p.estado]} />
      </View>
      {p.estado !== "cancelado" ? (
        <>
          <Text style={styles.nota}>
            {p.estado === "por_confirmar" ? "El albergue confirmará cuando vea tu pago." : p.estado === "atrasado" ? "Tu aporte de este mes está pendiente." : `Próximo aporte: ${proximo}.`}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <BotonRescate texto="Aportar este mes" style={{ flex: 1, minHeight: 44 }} onPress={() => router.push(`/rescate/apadrinar/${p.mascotaId}`)} />
            <BotonRescate texto={trabajando ? "…" : "Dejar de apadrinar"} tipo="secundario" style={{ flex: 1, minHeight: 44 }} deshabilitado={trabajando} onPress={onCancelar} />
          </View>
        </>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: { backgroundColor: colores.superficie, borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: colores.borde },
    cabeza: { flexDirection: "row", alignItems: "center", gap: 12 },
    foto: { width: 56, height: 56, borderRadius: 14 },
    titulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15.5, color: colores.texto },
    nota: { ...tipografia.pie, fontSize: 12.5, lineHeight: 18, color: colores.textoSuave },
    estado: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11.5, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, overflow: "hidden" },
    punto: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colores.bordeFuerte, backgroundColor: colores.superficie },
    linea: { flex: 1, width: 2, minHeight: 16, backgroundColor: colores.borde },
    etapa: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14, color: colores.texto },
    vacio: { backgroundColor: colores.superficie, borderRadius: 16, padding: espaciado.lg, gap: 12 },
    cerrado: { ...tipografia.pie, fontSize: 12.5, color: colores.primario, fontFamily: "SchibstedGrotesk_700Bold" },
  });
}
