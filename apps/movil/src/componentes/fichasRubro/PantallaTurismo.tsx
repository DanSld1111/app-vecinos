import { ReactNode, useMemo, useState } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AtributoProductoDef, TourConAgencia, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../disenio";
import { useComunidadActiva } from "../../estado/comunidadActiva";
import { useCategorias } from "../../datos/hooks/useCategorias";
import { useTours } from "../../datos/hooks/useProductos";
import { resolverFicha } from "../../utilidades/fichaNegocio";
import { useAlturaBarra, useDesplazamiento } from "../../utilidades/useDesplazamiento";
import { EsqueletoListaNegocios } from "../EsqueletoNegocio";
import { SinFoto } from "../SinFoto";
import { DetalleTour, FilaTour } from "./FichaTours";
import { camposFiltro, fotosDe, partesFecha, proximasSalidas } from "./utilidades";

const normalizar = (t: string) => t.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Cuando = "todas" | "finde" | "semana" | "mes";
const CUANDO: { id: Cuando; texto: string }[] = [
  { id: "todas", texto: "Cualquier fecha" },
  { id: "finde", texto: "Este fin de semana" },
  { id: "semana", texto: "Próximos 7 días" },
  { id: "mes", texto: "Este mes" },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** El rango [desde, hasta] de cada opción de "Cuándo", en fechas AAAA-MM-DD. */
function rango(cuando: Cuando): [string, string] | null {
  const hoy = new Date();
  if (cuando === "todas") return null;
  if (cuando === "semana") return [iso(hoy), iso(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7))];
  if (cuando === "mes") return [iso(hoy), iso(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0))];
  // Fin de semana: de hoy (si ya es sábado o domingo) o del próximo sábado, hasta el domingo.
  const dia = hoy.getDay();
  const sabado = dia === 0 ? hoy : new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + (6 - dia));
  const domingo = dia === 0 ? hoy : new Date(sabado.getFullYear(), sabado.getMonth(), sabado.getDate() + 1);
  return [iso(dia === 6 || dia === 0 ? hoy : sabado), iso(domingo)];
}

/**
 * Turismo (decisión 0096): en vez de una lista de agencias, las próximas salidas de todas ellas —
 * buscador, tipo de tour y "cuándo". El listado de agencias queda a un toque. Sin tours cargados,
 * se muestra directamente ese listado.
 */
export function PantallaTurismo({ titulo, listado }: { titulo: string; listado: ReactNode }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { comunidad } = useComunidadActiva();
  const { data: tours, isLoading } = useTours(comunidad?.id);
  const { data: categorias } = useCategorias();
  const desplazamiento = useDesplazamiento();
  const alturaBarra = useAlturaBarra();
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState<string | null>(null);
  const [cuando, setCuando] = useState<Cuando>("todas");
  const [abierto, setAbierto] = useState<TourConAgencia | null>(null);

  // Los campos de cada tour vienen de la categoría de su agencia.
  const camposDe = useMemo(() => {
    const mapa = new Map<string, AtributoProductoDef[]>();
    for (const t of tours ?? []) if (!mapa.has(t.negocio.id)) mapa.set(t.negocio.id, resolverFicha(t.negocio, categorias)?.campos ?? []);
    return (negocioId: string) => mapa.get(negocioId) ?? [];
  }, [tours, categorias]);

  const tipoDe = (t: TourConAgencia) => {
    const [f] = camposFiltro(camposDe(t.negocio.id));
    return f ? t.producto.atributos?.[f.clave] : undefined;
  };
  const tipos = useMemo(() => [...new Set((tours ?? []).map(tipoDe).filter((x): x is string => Boolean(x)))], [tours, camposDe]);

  const termino = normalizar(busqueda);
  const r = rango(cuando);
  const visibles = (tours ?? [])
    .filter((t) => !termino || normalizar(t.producto.nombre).includes(termino) || normalizar(t.negocio.nombre).includes(termino) || normalizar(t.producto.descripcion).includes(termino))
    .filter((t) => !tipo || tipoDe(t) === tipo)
    .filter((t) => !r || proximasSalidas(t.producto).some((s) => s.fecha >= r[0] && s.fecha <= r[1]));
  const filtrando = Boolean(termino || tipo || cuando !== "todas");
  const destacados = filtrando ? [] : (tours ?? []).filter((t) => t.producto.destacado).slice(0, 6);

  if (!isLoading && (tours ?? []).length === 0) return <>{listado}</>;

  return (
    <View style={styles.raiz}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + espaciado.lg, paddingBottom: alturaBarra + espaciado.xl, gap: espaciado.md }}
        onScroll={desplazamiento.onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.margen}>
          <View style={styles.filaTitulo}>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/servicios"))} hitSlop={10} style={styles.botonVolver} accessibilityRole="button" accessibilityLabel="Volver">
              <Ionicons name="chevron-back" size={24} color={colores.texto} />
            </Pressable>
            <Text style={styles.etiqueta}>{titulo}</Text>
          </View>
          <Text style={styles.hero}>¿A dónde vamos este fin de semana?</Text>
          <View style={styles.buscador}>
            <Ionicons name="search" size={16} color={colores.textoSuave} />
            <TextInput value={busqueda} onChangeText={setBusqueda} placeholder="Buscar destino, tour o agencia…" placeholderTextColor={colores.textoTenue} style={styles.entrada} />
            {busqueda ? (
              <Pressable onPress={() => setBusqueda("")} hitSlop={8} accessibilityLabel="Borrar búsqueda">
                <Ionicons name="close-circle" size={16} color={colores.textoTenue} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {tipos.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaChips}>
            {[null, ...tipos].map((o) => {
              const activo = tipo === o;
              return (
                <Pressable key={o ?? "todos"} onPress={() => setTipo(o)} style={[styles.chip, activo && styles.chipActivo]} accessibilityRole="button" accessibilityState={{ selected: activo }}>
                  <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{o ?? "Todos"}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaChips}>
          {CUANDO.map((c) => {
            const activo = cuando === c.id;
            return (
              <Pressable key={c.id} onPress={() => setCuando(c.id)} style={[styles.chipFecha, activo && styles.chipFechaActivo]} accessibilityRole="button" accessibilityState={{ selected: activo }}>
                <Ionicons name="calendar-outline" size={14} color={activo ? colores.primarioFuerte : colores.textoSuave} />
                <Text style={[styles.chipFechaTexto, activo && { color: colores.primarioFuerte }]}>{c.texto}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.margen}>
            <EsqueletoListaNegocios cantidad={3} />
          </View>
        ) : null}

        {destacados.length ? (
          <View style={{ gap: 8 }}>
            <Text style={[styles.subtitulo, styles.margen]}>Destacados</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaChips} snapToInterval={262} decelerationRate="fast">
              {destacados.map((t) => {
                const foto = fotosDe(t.producto)[0];
                const salida = proximasSalidas(t.producto)[0];
                const partes = salida ? partesFecha(salida.fecha) : null;
                return (
                  <Pressable key={t.producto.id} onPress={() => setAbierto(t)} style={styles.destacado} accessibilityRole="button" accessibilityLabel={t.producto.nombre}>
                    {foto ? <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <SinFoto icono="map-outline" style={StyleSheet.absoluteFill} />}
                    <View style={styles.velo} />
                    {partes ? (
                      <View style={styles.fechaFlotante}>
                        <Text style={styles.fechaFlotanteDia}>{partes.dia}</Text>
                        <Text style={styles.fechaFlotanteNum}>{partes.fecha}</Text>
                      </View>
                    ) : null}
                    <View style={styles.textoDestacado}>
                      <Text style={styles.nombreDestacado} numberOfLines={2}>
                        {t.producto.nombre}
                      </Text>
                      <Text style={styles.precioDestacado}>
                        Desde {formatearPrecio(t.producto.precio, t.producto.moneda ?? t.negocio.moneda)} · {t.negocio.nombre}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {!isLoading ? (
          <View style={[styles.margen, { gap: 10 }]}>
            <Text style={styles.subtitulo}>{filtrando ? `${visibles.length} ${visibles.length === 1 ? "tour" : "tours"}` : "Próximas salidas"}</Text>
            {visibles.length === 0 ? <Text style={styles.vacio}>No hay salidas con ese filtro. Prueba con otra fecha.</Text> : null}
            {visibles.map((t) => (
              <FilaTour key={t.producto.id} tour={t.producto} moneda={t.negocio.moneda} campos={camposDe(t.negocio.id)} agencia={t.negocio.nombre} onPress={() => setAbierto(t)} />
            ))}
            <Pressable onPress={() => router.push("/servicios/turismo?vista=agencias")} style={styles.botonAgencias} accessibilityRole="button">
              <Ionicons name="business-outline" size={18} color={colores.texto} />
              <Text style={styles.botonAgenciasTexto}>Ver todas las agencias</Text>
              <Ionicons name="chevron-forward" size={16} color={colores.texto} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <DetalleTour
        tour={abierto?.producto ?? null}
        moneda={abierto?.negocio.moneda ?? "PEN"}
        campos={abierto ? camposDe(abierto.negocio.id) : []}
        agencia={abierto ? { id: abierto.negocio.id, nombre: abierto.negocio.nombre, whatsapp: abierto.negocio.whatsapp } : undefined}
        mostrarAgencia
        onCerrar={() => setAbierto(null)}
      />
    </View>
  );
}


function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },
    margen: { paddingHorizontal: espaciado.lg },
    filaTitulo: { flexDirection: "row", alignItems: "center", gap: espaciado.xs, marginLeft: -espaciado.xs },
    botonVolver: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
    etiqueta: { ...tipografia.cuerpoDestacado, fontSize: 15, color: colores.textoSuave },
    hero: { ...tipografia.titulo, fontSize: 27, lineHeight: 32, color: colores.texto, marginTop: 6, marginBottom: espaciado.md },
    buscador: { flexDirection: "row", alignItems: "center", gap: espaciado.sm, borderRadius: 12, borderWidth: 1.5, borderColor: colores.texto, paddingHorizontal: espaciado.md, height: 46 },
    entrada: { flex: 1, ...tipografia.cuerpo, color: colores.texto, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) },
    filaChips: { gap: 6, paddingHorizontal: espaciado.lg },
    chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderColor: colores.bordeFuerte, justifyContent: "center", backgroundColor: colores.superficie },
    chipActivo: { backgroundColor: colores.texto, borderColor: colores.texto },
    chipTexto: { ...tipografia.pie, fontSize: 13, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    chipTextoActivo: { color: colores.fondo },
    chipFecha: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: colores.superficieHundida },
    chipFechaActivo: { backgroundColor: colores.primarioSuave },
    chipFechaTexto: { ...tipografia.pie, fontSize: 12.5, fontFamily: "SchibstedGrotesk_700Bold", color: colores.textoSuave },
    subtitulo: { ...tipografia.subtitulo, fontSize: 17, color: colores.texto },
    destacado: { width: 250, height: 300, borderRadius: 20, overflow: "hidden", backgroundColor: colores.superficieHundida },
    velo: { position: "absolute", left: 0, right: 0, bottom: 0, height: 150, backgroundColor: "rgba(0,0,0,0.45)" },
    fechaFlotante: { position: "absolute", top: 12, left: 12, backgroundColor: "#ffffff", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
    fechaFlotanteDia: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 11, color: "#5b635e" },
    fechaFlotanteNum: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14, color: "#141a16" },
    textoDestacado: { position: "absolute", left: 14, right: 14, bottom: 14, gap: 4 },
    nombreDestacado: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 18, lineHeight: 22, color: "#ffffff" },
    precioDestacado: { fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 13, color: "rgba(255,255,255,0.92)" },
    vacio: { ...tipografia.cuerpo, color: colores.textoSuave, paddingVertical: espaciado.md },
    botonAgencias: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, borderRadius: 24, borderWidth: 1.5, borderColor: colores.texto, marginTop: espaciado.sm },
    botonAgenciasTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14.5, color: colores.texto },
  });
}
