import { abrirWhatsapp } from "../../utilidades/whatsapp";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AtributoProductoDef, Moneda, Producto, SalidaTour, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../disenio";
import { GaleriaFotos } from "./GaleriaFotos";
import { SinFoto } from "../SinFoto";
import { camposFiltro, datosDe, fotosDe, horaLegible, numerosDe, partesFecha, proximasSalidas, textoCupos, textoNumero } from "./utilidades";

const normalizar = (t: string) => t.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** La agencia de un tour, para el botón "Ver agencia" y el WhatsApp de la reserva. */
export interface AgenciaTour {
  id: string;
  nombre: string;
  whatsapp?: string | null;
}

/**
 * Ficha «Tours» (decisión 0096): cada tour en una fila con foto, duración, la próxima salida y el
 * precio por persona. Tocarla abre el detalle con fechas, itinerario y la reserva por WhatsApp.
 */
export function FichaTours({
  productos,
  moneda,
  agencia,
  busqueda,
  titulo,
  campos,
}: {
  productos: Producto[];
  moneda: Moneda;
  agencia: AgenciaTour;
  busqueda: string;
  titulo?: string;
  campos: AtributoProductoDef[];
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [filtro] = camposFiltro(campos);
  const [opcion, setOpcion] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<Producto | null>(null);
  const opciones = filtro ? (filtro.opciones ?? []).filter((o) => productos.some((p) => normalizar(p.atributos?.[filtro.clave] ?? "") === normalizar(o))) : [];
  const termino = normalizar(busqueda);

  const visibles = useMemo(
    () =>
      productos
        .filter((p) => !termino || normalizar(p.nombre).includes(termino) || normalizar(p.descripcion).includes(termino))
        .filter((p) => !filtro || !opcion || normalizar(p.atributos?.[filtro.clave] ?? "") === normalizar(opcion))
        // Primero los que salen pronto; los que no tienen fecha, al final.
        .sort((a, b) => {
          const sa = proximasSalidas(a)[0];
          const sb = proximasSalidas(b)[0];
          if (sa && sb) return (sa.fecha + sa.hora).localeCompare(sb.fecha + sb.hora);
          return sa ? -1 : sb ? 1 : Number(b.destacado) - Number(a.destacado);
        }),
    [productos, termino, filtro, opcion],
  );

  return (
    <View style={{ gap: espaciado.md }}>
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
      {opciones.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[null, ...opciones].map((o) => {
            const activo = opcion === o;
            return (
              <Pressable key={o ?? "todos"} onPress={() => setOpcion(o)} style={[styles.chip, activo && styles.chipActivo]} accessibilityRole="button" accessibilityState={{ selected: activo }}>
                <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{o ?? "Todos"}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      {visibles.length === 0 ? <Text style={styles.vacio}>No hay tours con ese filtro.</Text> : null}
      <View style={{ gap: 10 }}>
        {visibles.map((p) => (
          <FilaTour key={p.id} tour={p} moneda={moneda} campos={campos} onPress={() => setAbierto(p)} />
        ))}
      </View>
      <DetalleTour tour={abierto} moneda={moneda} campos={campos} agencia={agencia} onCerrar={() => setAbierto(null)} />
    </View>
  );
}

/** Una fila de tour: foto, tipo, nombre, duración · próxima salida, precio por persona y cupos. */
export function FilaTour({
  tour,
  moneda,
  campos,
  agencia,
  onPress,
}: {
  tour: Producto;
  moneda: Moneda;
  campos: AtributoProductoDef[];
  /** Solo en la pantalla de Turismo, donde se mezclan agencias. */
  agencia?: string;
  onPress: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const foto = fotosDe(tour)[0];
  const [filtro] = camposFiltro(campos);
  const tipo = filtro ? tour.atributos?.[filtro.clave] : undefined;
  const duracion = datosDe(tour, campos).find((d) => d.campo.clave !== filtro?.clave)?.valor;
  const salida = proximasSalidas(tour)[0];
  const cupos = textoCupos(salida);
  const cuando = salida ? `${partesFecha(salida.fecha).dia} ${partesFecha(salida.fecha).fecha}` : null;
  return (
    <Pressable style={styles.fila} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${tour.nombre}, ${formatearPrecio(tour.precio, tour.moneda ?? moneda)} por persona`}>
      <View style={styles.fotoFila}>
        {foto ? <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <SinFoto icono="map-outline" tamanoIcono={22} style={StyleSheet.absoluteFill} />}
      </View>
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        {tipo ? <Text style={styles.tipo}>{tipo}</Text> : null}
        <Text style={styles.nombreFila} numberOfLines={2}>
          {tour.nombre}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[duracion, cuando ? `Sale ${cuando}` : null, agencia].filter(Boolean).join(" · ")}
        </Text>
        <View style={styles.filaPrecio}>
          <Text style={styles.precio}>
            {formatearPrecio(tour.precio, tour.moneda ?? moneda)}
            <Text style={styles.pp}> p. p.</Text>
          </Text>
          {cupos.texto ? <Text style={[styles.cupos, cupos.pocos && { color: colores.error }]}>{cupos.texto}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

/** El detalle de un tour, compartido por la ficha de la agencia y la pantalla de Turismo. */
export function DetalleTour({
  tour,
  moneda,
  campos,
  agencia,
  mostrarAgencia = false,
  onCerrar,
}: {
  tour: Producto | null;
  moneda: Moneda;
  campos: AtributoProductoDef[];
  agencia?: AgenciaTour;
  /** Botón "Ver agencia" (en Turismo; en la ficha de la agencia ya se está en ella). */
  mostrarAgencia?: boolean;
  onCerrar: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ancho = Math.min(width, 640);
  const salidas = useMemo(() => (tour ? proximasSalidas(tour) : []), [tour]);
  const [elegida, setElegida] = useState<SalidaTour | null>(null);
  const [personas, setPersonas] = useState(2);

  useEffect(() => {
    setElegida(salidas.find((s) => s.cupos !== 0) ?? null);
    setPersonas(2);
  }, [salidas]);

  if (!tour) return null;
  const mon = tour.moneda ?? moneda;
  const det = tour.detalle ?? {};
  const [filtro] = camposFiltro(campos);
  const tipo = filtro ? tour.atributos?.[filtro.clave] : undefined;
  const datos = [
    ...datosDe(tour, campos).filter((d) => d.campo.clave !== filtro?.clave),
    ...numerosDe(tour, campos).map((n) => ({ campo: n.campo, valor: textoNumero(n.campo, n.valor) })),
  ];
  const maximo = elegida?.cupos ?? 20;
  const total = tour.precio * personas;
  const whatsapp = agencia?.whatsapp;

  const reservar = () => {
    if (!whatsapp) return;
    const fecha = elegida ? ` para el ${partesFecha(elegida.fecha).dia.toLowerCase()} ${partesFecha(elegida.fecha).fecha} (salida ${horaLegible(elegida.hora)})` : "";
    const texto = `Hola, quiero reservar "${tour.nombre}"${fecha} para ${personas} ${personas === 1 ? "persona" : "personas"}. Total: ${formatearPrecio(total, mon)}.`;
    abrirWhatsapp(whatsapp, texto);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onCerrar}>
      <View style={[styles.raizDetalle, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 150, width: ancho, alignSelf: "center" }}>
          <View>
            <GaleriaFotos fotos={fotosDe(tour)} alto={Math.round(ancho * 0.7)} ancho={ancho} icono="map-outline" />
            <Pressable onPress={onCerrar} style={styles.volver} accessibilityRole="button" accessibilityLabel="Volver">
              <Ionicons name="chevron-back" size={24} color="#141a16" />
            </Pressable>
          </View>
          <View style={styles.cuerpo}>
            {tipo ? <Text style={styles.tipo}>{tipo}</Text> : null}
            <Text style={styles.nombreGrande}>{tour.nombre}</Text>
            {agencia ? (
              mostrarAgencia ? (
                <Pressable
                  onPress={() => {
                    onCerrar();
                    router.push(`/negocio/${agencia.id}`);
                  }}
                  style={styles.agencia}
                  accessibilityRole="link"
                >
                  <Ionicons name="business-outline" size={16} color={colores.primario} />
                  <Text style={styles.agenciaTexto}>{agencia.nombre}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colores.primario} />
                </Pressable>
              ) : (
                <Text style={styles.meta}>Con {agencia.nombre}</Text>
              )
            ) : null}

            {datos.length ? (
              <View style={styles.datos}>
                {datos.map((d) => (
                  <View key={d.campo.clave} style={styles.datoCaja}>
                    <Text style={styles.datoEtiqueta}>{d.campo.etiqueta}</Text>
                    <Text style={styles.datoValor}>{d.valor}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {salidas.length ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.subtitulo}>Próximas salidas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {salidas.map((s) => {
                    const partes = partesFecha(s.fecha);
                    const activo = elegida?.fecha === s.fecha && elegida?.hora === s.hora;
                    const agotado = s.cupos === 0;
                    const cupos = textoCupos(s);
                    return (
                      <Pressable
                        key={s.fecha + s.hora}
                        disabled={agotado}
                        onPress={() => {
                          setElegida(s);
                          if (s.cupos !== null && personas > s.cupos) setPersonas(Math.max(1, s.cupos));
                        }}
                        style={[styles.fecha, activo && styles.fechaActiva, agotado && { opacity: 0.45 }]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activo, disabled: agotado }}
                        accessibilityLabel={`${partes.dia} ${partes.fecha}, ${horaLegible(s.hora)}, ${cupos.texto}`}
                      >
                        <Text style={[styles.fechaDia, activo && styles.fechaTextoActivo]}>{partes.dia}</Text>
                        <Text style={[styles.fechaNum, activo && styles.fechaTextoActivo]}>{partes.fecha}</Text>
                        <Text style={[styles.fechaHora, activo && styles.fechaTextoActivo]}>{horaLegible(s.hora)}</Text>
                        {s.cupos !== null ? (
                          <Text style={[styles.fechaCupos, activo ? styles.fechaTextoActivo : cupos.pocos && { color: colores.error }]}>{agotado ? "Agotado" : `${s.cupos} cupos`}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {tour.descripcion ? <Text style={styles.descripcion}>{tour.descripcion}</Text> : null}

            {det.itinerario?.length ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.subtitulo}>Itinerario</Text>
                <View>
                  {det.itinerario.map((paso, i) => (
                    <View key={i} style={styles.paso}>
                      <View style={styles.linea}>
                        <View style={styles.punto} />
                        {i < det.itinerario!.length - 1 ? <View style={styles.trazo} /> : null}
                      </View>
                      <View style={{ flex: 1, paddingBottom: 14 }}>
                        <Text style={styles.pasoHora}>{paso.hora ? horaLegible(paso.hora) : ""}</Text>
                        <Text style={styles.pasoTitulo}>{paso.titulo}</Text>
                        {paso.detalle ? <Text style={styles.pasoDetalle}>{paso.detalle}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {det.incluye?.length || det.noIncluye?.length ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.subtitulo}>Qué incluye</Text>
                {(det.incluye ?? []).map((t) => (
                  <View key={"si" + t} style={styles.item}>
                    <Ionicons name="checkmark-circle" size={18} color={colores.primario} />
                    <Text style={styles.itemTexto}>{t}</Text>
                  </View>
                ))}
                {(det.noIncluye ?? []).map((t) => (
                  <View key={"no" + t} style={styles.item}>
                    <Ionicons name="close-circle" size={18} color={colores.textoTenue} />
                    <Text style={[styles.itemTexto, { color: colores.textoSuave }]}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {det.puntoEncuentro ? (
              <View style={styles.cajaInfo}>
                <Ionicons name="location-outline" size={18} color={colores.primario} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cajaTitulo}>Punto de recojo</Text>
                  <Text style={styles.cajaTexto}>{det.puntoEncuentro}</Text>
                </View>
              </View>
            ) : null}
            {det.cancelacion ? (
              <View style={styles.cajaInfo}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colores.primario} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cajaTitulo}>Cancelación</Text>
                  <Text style={styles.cajaTexto}>{det.cancelacion}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.filaPersonas}>
            <View style={{ flex: 1 }}>
              <Text style={styles.precio}>
                {formatearPrecio(total, mon)}
                <Text style={styles.pp}>
                  {"  "}
                  {formatearPrecio(tour.precio, mon)} × {personas}
                </Text>
              </Text>
            </View>
            <View style={styles.stepper}>
              <Pressable onPress={() => setPersonas((n) => Math.max(1, n - 1))} style={styles.paso2} accessibilityRole="button" accessibilityLabel="Una persona menos">
                <Ionicons name="remove" size={18} color={colores.texto} />
              </Pressable>
              <Text style={styles.personas} accessibilityLabel={`${personas} personas`}>
                {personas}
              </Text>
              <Pressable onPress={() => setPersonas((n) => Math.min(maximo || 1, n + 1))} style={styles.paso2} accessibilityRole="button" accessibilityLabel="Una persona más">
                <Ionicons name="add" size={18} color={colores.texto} />
              </Pressable>
            </View>
          </View>
          {whatsapp ? (
            <Pressable style={styles.botonPrincipal} onPress={reservar} accessibilityRole="button">
              <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
              <Text style={styles.botonPrincipalTexto}>Reservar por WhatsApp</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    titulo: { ...tipografia.subtitulo, color: colores.texto },
    chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderColor: colores.bordeFuerte, justifyContent: "center", backgroundColor: colores.superficie },
    chipActivo: { backgroundColor: colores.texto, borderColor: colores.texto },
    chipTexto: { ...tipografia.pie, fontSize: 13, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    chipTextoActivo: { color: colores.fondo },
    vacio: { ...tipografia.cuerpo, color: colores.textoSuave, textAlign: "center", paddingVertical: espaciado.lg },
    fila: { flexDirection: "row", gap: 12, backgroundColor: colores.superficie, borderRadius: 16, padding: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: colores.borde },
    fotoFila: { width: 96, height: 104, borderRadius: 12, overflow: "hidden", backgroundColor: colores.superficieHundida },
    tipo: { alignSelf: "flex-start", backgroundColor: colores.primarioSuave, color: colores.primarioFuerte, fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11.5, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, overflow: "hidden" },
    nombreFila: { ...tipografia.cuerpoDestacado, fontSize: 15, color: colores.texto },
    meta: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave },
    filaPrecio: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 6, marginTop: 2, flexWrap: "wrap" },
    precio: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 17, color: colores.texto },
    pp: { fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 12.5, color: colores.textoSuave },
    cupos: { ...tipografia.pie, fontSize: 12, fontFamily: "SchibstedGrotesk_700Bold", color: colores.textoSuave },
    raizDetalle: { flex: 1, backgroundColor: colores.fondo },
    volver: { position: "absolute", top: 12, left: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
    cuerpo: { padding: espaciado.lg, gap: espaciado.md },
    nombreGrande: { ...tipografia.subtitulo, fontSize: 21, lineHeight: 26, color: colores.texto },
    agencia: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 32 },
    agenciaTexto: { ...tipografia.cuerpoDestacado, fontSize: 14, color: colores.primario },
    datos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    datoCaja: { flexBasis: "47%", flexGrow: 1, backgroundColor: colores.superficieHundida, borderRadius: 12, padding: 10, gap: 2 },
    datoEtiqueta: { ...tipografia.pie, fontSize: 11.5, color: colores.textoSuave },
    datoValor: { ...tipografia.cuerpoDestacado, fontSize: 14, color: colores.texto },
    subtitulo: { ...tipografia.subtitulo, fontSize: 16, color: colores.texto },
    fecha: { width: 86, borderRadius: 14, borderWidth: 1.5, borderColor: colores.bordeFuerte, paddingVertical: 10, alignItems: "center", gap: 1, backgroundColor: colores.superficie },
    fechaActiva: { backgroundColor: colores.primario, borderColor: colores.primario },
    fechaDia: { ...tipografia.pie, fontSize: 12, fontFamily: "SchibstedGrotesk_700Bold", color: colores.textoSuave },
    fechaNum: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 16, color: colores.texto },
    fechaHora: { ...tipografia.pie, fontSize: 11.5, color: colores.textoSuave },
    fechaCupos: { ...tipografia.pie, fontSize: 11, fontFamily: "SchibstedGrotesk_700Bold", color: colores.textoSuave, marginTop: 2 },
    fechaTextoActivo: { color: "#ffffff" },
    descripcion: { ...tipografia.cuerpo, fontSize: 14.5, lineHeight: 21, color: colores.textoSuave },
    paso: { flexDirection: "row", gap: 12 },
    linea: { width: 14, alignItems: "center" },
    punto: { width: 12, height: 12, borderRadius: 6, backgroundColor: colores.primario, marginTop: 4 },
    trazo: { flex: 1, width: 2, backgroundColor: colores.borde, marginTop: 2 },
    pasoHora: { ...tipografia.pie, fontSize: 12, fontFamily: "SchibstedGrotesk_700Bold", color: colores.primario },
    pasoTitulo: { ...tipografia.cuerpoDestacado, fontSize: 14.5, color: colores.texto },
    pasoDetalle: { ...tipografia.pie, fontSize: 13, color: colores.textoSuave },
    item: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
    itemTexto: { ...tipografia.cuerpo, fontSize: 14, color: colores.texto, flex: 1 },
    cajaInfo: { flexDirection: "row", gap: 10, backgroundColor: colores.superficieHundida, borderRadius: 14, padding: 12 },
    cajaTitulo: { ...tipografia.cuerpoDestacado, fontSize: 14, color: colores.texto },
    cajaTexto: { ...tipografia.pie, fontSize: 13, color: colores.textoSuave },
    pie: { position: "absolute", left: 0, right: 0, bottom: 0, gap: 10, paddingHorizontal: espaciado.lg, paddingTop: 12, backgroundColor: colores.fondo, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
    filaPersonas: { flexDirection: "row", alignItems: "center", gap: 10 },
    stepper: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1.5, borderColor: colores.bordeFuerte, borderRadius: 24, padding: 3 },
    paso2: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    personas: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 16, color: colores.texto, minWidth: 22, textAlign: "center" },
    botonPrincipal: { minHeight: 50, borderRadius: 25, backgroundColor: colores.primario, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
    botonPrincipalTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: "#ffffff" },
  });
}
