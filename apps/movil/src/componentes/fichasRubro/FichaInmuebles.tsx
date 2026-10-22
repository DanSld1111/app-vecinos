import { useMemo, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AtributoProductoDef, Moneda, Producto, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../disenio";
import { sufijoPrecio } from "../../utilidades/fichaNegocio";
import { GaleriaFotos } from "./GaleriaFotos";
import { areaM2, camposFiltro, caracteristicasDe, datosDe, fotosDe, numerosDe, textoNumero } from "./utilidades";
import { SinFoto } from "../SinFoto";

const normalizar = (t: string) => t.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Ficha «Inmuebles» (decisión 0096): Venta / Alquiler arriba, tipo de inmueble en chips, y cada
 * inmueble en una tarjeta grande con precio, dormitorios, baños y m². Tocarla abre el detalle.
 */
export function FichaInmuebles({
  productos,
  moneda,
  whatsapp,
  busqueda,
  titulo,
  campos,
}: {
  productos: Producto[];
  moneda: Moneda;
  whatsapp?: string | null;
  busqueda: string;
  titulo?: string;
  campos: AtributoProductoDef[];
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [principal, secundario] = camposFiltro(campos);
  const [opcion1, setOpcion1] = useState<string | null>(null);
  const [opcion2, setOpcion2] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<Producto | null>(null);

  // Solo las opciones que algún inmueble tiene: un botón que lleva a una lista vacía confunde.
  const opcionesDe = (c?: AtributoProductoDef) =>
    c ? (c.opciones ?? []).filter((o) => productos.some((p) => normalizar(p.atributos?.[c.clave] ?? "") === normalizar(o))) : [];
  const opciones1 = opcionesDe(principal);
  const opciones2 = opcionesDe(secundario);

  const termino = normalizar(busqueda);
  const visibles = useMemo(
    () =>
      productos
        .filter((p) => !termino || normalizar(p.nombre).includes(termino) || normalizar(p.descripcion).includes(termino))
        .filter((p) => !principal || !opcion1 || normalizar(p.atributos?.[principal.clave] ?? "") === normalizar(opcion1))
        .filter((p) => !secundario || !opcion2 || normalizar(p.atributos?.[secundario.clave] ?? "") === normalizar(opcion2))
        .sort((a, b) => Number(b.destacado) - Number(a.destacado)),
    [productos, termino, principal, secundario, opcion1, opcion2],
  );

  return (
    <View style={{ gap: espaciado.md }}>
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}

      {opciones1.length > 1 ? (
        <View style={styles.segmentos} accessibilityRole="tablist" accessibilityLabel={principal!.etiqueta}>
          {[null, ...opciones1].map((o) => {
            const activo = opcion1 === o;
            return (
              <Pressable key={o ?? "todos"} onPress={() => setOpcion1(o)} style={[styles.segmento, activo && styles.segmentoActivo]} accessibilityRole="tab" accessibilityState={{ selected: activo }}>
                <Text style={[styles.segmentoTexto, activo && styles.segmentoTextoActivo]}>{o ?? "Todos"}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {opciones2.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[null, ...opciones2].map((o) => {
            const activo = opcion2 === o;
            return (
              <Pressable key={o ?? "todos"} onPress={() => setOpcion2(o)} style={[styles.chip, activo && styles.chipActivo]} accessibilityRole="button" accessibilityState={{ selected: activo }}>
                <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{o ?? "Todos"}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {visibles.length === 0 ? <Text style={styles.vacio}>No hay inmuebles con ese filtro.</Text> : null}

      {visibles.map((p) => {
        const fotos = fotosDe(p);
        const nums = numerosDe(p, campos).slice(0, 3);
        const extra = caracteristicasDe(p, campos)[0];
        const op = principal ? p.atributos?.[principal.clave] : undefined;
        const m2 = areaM2(p, campos);
        const mon = p.moneda ?? moneda;
        return (
          <Pressable key={p.id} style={styles.tarjeta} onPress={() => setAbierto(p)} accessibilityRole="button" accessibilityLabel={`${p.nombre}, ${formatearPrecio(p.precio, mon)}`}>
            <View style={styles.fotoTarjeta}>
              {fotos[0] ? <Image source={{ uri: fotos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <SinFoto icono="home-outline" tamanoIcono={28} style={StyleSheet.absoluteFill} />}
              <View style={styles.insignias}>
                {op ? <Text style={styles.insigniaVerde}>{op}</Text> : null}
                {extra ? <Text style={styles.insigniaBlanca}>{extra}</Text> : null}
              </View>
              {fotos.length > 1 ? <Text style={styles.contador}>1/{fotos.length}</Text> : null}
            </View>
            <View style={styles.infoTarjeta}>
              <View style={styles.filaPrecio}>
                <Text style={styles.precio}>
                  {formatearPrecio(p.precio, mon)}
                  <Text style={styles.sufijo}>{sufijoPrecio(p.atributos, campos)}</Text>
                </Text>
                {m2 && !sufijoPrecio(p.atributos, campos) ? <Text style={styles.porM2}>{formatearPrecio(Math.round(p.precio / m2), mon)} por m²</Text> : null}
              </View>
              <Text style={styles.nombre} numberOfLines={2}>
                {p.nombre}
              </Text>
              {nums.length ? <Text style={styles.specs}>{nums.map((n) => textoNumero(n.campo, n.valor)).join("  ·  ")}</Text> : null}
            </View>
          </Pressable>
        );
      })}

      <DetalleInmueble p={abierto} moneda={moneda} campos={campos} whatsapp={whatsapp} principal={principal} onCerrar={() => setAbierto(null)} />
    </View>
  );
}

function DetalleInmueble({
  p,
  moneda,
  campos,
  whatsapp,
  principal,
  onCerrar,
}: {
  p: Producto | null;
  moneda: Moneda;
  campos: AtributoProductoDef[];
  whatsapp?: string | null;
  principal?: AtributoProductoDef;
  onCerrar: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ancho = Math.min(width, 640);
  if (!p) return null;
  const mon = p.moneda ?? moneda;
  const nums = numerosDe(p, campos);
  const carac = caracteristicasDe(p, campos);
  const datos = datosDe(p, campos).filter((d) => d.campo.clave !== principal?.clave);
  const m2 = areaM2(p, campos);
  const sufijo = sufijoPrecio(p.atributos, campos);
  const escribir = (texto: string) => whatsapp && Linking.openURL(`https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`);

  return (
    <Modal visible animationType="slide" onRequestClose={onCerrar}>
      <View style={[styles.raizDetalle, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120, width: ancho, alignSelf: "center" }}>
          <View>
            <GaleriaFotos fotos={fotosDe(p)} alto={Math.round(ancho * 0.75)} ancho={ancho} icono="home-outline" />
            <Pressable onPress={onCerrar} style={styles.volver} accessibilityRole="button" accessibilityLabel="Volver">
              <Ionicons name="chevron-back" size={24} color="#141a16" />
            </Pressable>
          </View>
          <View style={styles.cuerpo}>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {principal && p.atributos?.[principal.clave] ? <Text style={styles.insigniaVerde}>{p.atributos[principal.clave]}</Text> : null}
              {datos.slice(0, 1).map((d) => (
                <Text key={d.campo.clave} style={styles.insigniaSuave}>
                  {d.valor}
                </Text>
              ))}
            </View>
            <Text style={styles.precioGrande}>
              {formatearPrecio(p.precio, mon)}
              <Text style={styles.sufijo}>{sufijo}</Text>
            </Text>
            {m2 && !sufijo ? <Text style={styles.porM2}>{formatearPrecio(Math.round(p.precio / m2), mon)} por m²</Text> : null}
            <Text style={styles.nombreGrande}>{p.nombre}</Text>

            {nums.length ? (
              <View style={styles.cuadros}>
                {nums.map((n) => (
                  <View key={n.campo.clave} style={styles.cuadro}>
                    <Text style={styles.cuadroValor}>{n.campo.unidad ? `${n.valor} ${n.campo.unidad}` : n.valor}</Text>
                    <Text style={styles.cuadroEtiqueta} numberOfLines={2}>
                      {!n.campo.unidad && n.valor === "1" ? n.campo.etiqueta.replace(/s$/, "") : n.campo.etiqueta}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {carac.length ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.subtitulo}>Características</Text>
                <View style={styles.chipsCarac}>
                  {carac.map((c) => (
                    <View key={c} style={styles.chipCarac}>
                      <Ionicons name="checkmark" size={14} color={colores.primario} />
                      <Text style={styles.chipCaracTexto}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {datos.length > 1 ? (
              <View style={{ gap: 6 }}>
                {datos.slice(1).map((d) => (
                  <Text key={d.campo.clave} style={styles.dato}>
                    <Text style={{ fontFamily: "SchibstedGrotesk_700Bold" }}>{d.campo.etiqueta}: </Text>
                    {d.valor}
                  </Text>
                ))}
              </View>
            ) : null}

            {p.descripcion ? (
              <View style={{ gap: 6 }}>
                <Text style={styles.subtitulo}>Descripción</Text>
                <Text style={styles.descripcion}>{p.descripcion}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
        {whatsapp ? (
          <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <Pressable style={styles.botonSecundario} onPress={() => escribir(`Hola, quiero agendar una visita para ver "${p.nombre}".`)} accessibilityRole="button">
              <Text style={styles.botonSecundarioTexto}>Agendar visita</Text>
            </Pressable>
            <Pressable style={styles.botonPrincipal} onPress={() => escribir(`Hola, me interesa "${p.nombre}" (${formatearPrecio(p.precio, mon)}${sufijo}).`)} accessibilityRole="button">
              <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
              <Text style={styles.botonPrincipalTexto}>Consultar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    titulo: { ...tipografia.subtitulo, color: colores.texto },
    segmentos: { flexDirection: "row", backgroundColor: colores.superficieHundida, borderRadius: 12, padding: 4, gap: 4 },
    segmento: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: "center", justifyContent: "center" },
    segmentoActivo: { backgroundColor: colores.superficie, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    segmentoTexto: { ...tipografia.cuerpoDestacado, fontSize: 14, color: colores.textoSuave },
    segmentoTextoActivo: { color: colores.texto, fontFamily: "SchibstedGrotesk_800ExtraBold" },
    chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderColor: colores.bordeFuerte, justifyContent: "center", backgroundColor: colores.superficie },
    chipActivo: { backgroundColor: colores.texto, borderColor: colores.texto },
    chipTexto: { ...tipografia.pie, fontSize: 13, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    chipTextoActivo: { color: colores.fondo },
    vacio: { ...tipografia.cuerpo, color: colores.textoSuave, textAlign: "center", paddingVertical: espaciado.lg },
    tarjeta: { backgroundColor: colores.superficie, borderRadius: 18, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: colores.borde },
    fotoTarjeta: { height: 200, backgroundColor: colores.superficieHundida },
    insignias: { position: "absolute", top: 10, left: 10, flexDirection: "row", gap: 6 },
    insigniaVerde: { backgroundColor: colores.primario, color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden", alignSelf: "flex-start" },
    insigniaBlanca: { backgroundColor: "#ffffff", color: "#141a16", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
    insigniaSuave: { backgroundColor: colores.primarioSuave, color: colores.primarioFuerte, fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
    contador: { position: "absolute", bottom: 10, right: 10, color: "#ffffff", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, fontFamily: "SchibstedGrotesk_700Bold", fontSize: 12, overflow: "hidden" },
    infoTarjeta: { padding: 14, gap: 4 },
    filaPrecio: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
    precio: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 21, color: colores.texto },
    sufijo: { fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 14, color: colores.textoSuave },
    porM2: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave },
    nombre: { ...tipografia.cuerpoDestacado, fontSize: 14.5, color: colores.texto },
    specs: { ...tipografia.pie, fontSize: 13, color: colores.textoSuave, marginTop: 2 },
    raizDetalle: { flex: 1, backgroundColor: colores.fondo },
    volver: { position: "absolute", top: 12, left: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
    cuerpo: { padding: espaciado.lg, gap: espaciado.md },
    precioGrande: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 28, color: colores.texto, marginTop: 4 },
    nombreGrande: { ...tipografia.subtitulo, fontSize: 18, color: colores.texto },
    cuadros: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    cuadro: { flexBasis: "22%", flexGrow: 1, minWidth: 72, backgroundColor: colores.superficieHundida, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6, alignItems: "center", gap: 2 },
    cuadroValor: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 19, color: colores.texto },
    cuadroEtiqueta: { ...tipografia.pie, fontSize: 11.5, color: colores.textoSuave, textAlign: "center" },
    subtitulo: { ...tipografia.subtitulo, fontSize: 16, color: colores.texto },
    chipsCarac: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chipCarac: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1.5, borderColor: colores.bordeFuerte, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
    chipCaracTexto: { ...tipografia.pie, fontSize: 13, fontFamily: "SchibstedGrotesk_600SemiBold", color: colores.texto },
    dato: { ...tipografia.cuerpo, fontSize: 14, color: colores.texto },
    descripcion: { ...tipografia.cuerpo, fontSize: 14.5, lineHeight: 21, color: colores.textoSuave },
    pie: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 8, paddingHorizontal: espaciado.lg, paddingTop: 12, backgroundColor: colores.fondo, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
    botonSecundario: { flex: 1, minHeight: 50, borderRadius: 25, borderWidth: 1.5, borderColor: colores.texto, alignItems: "center", justifyContent: "center" },
    botonSecundarioTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: colores.texto },
    botonPrincipal: { flex: 1.3, minHeight: 50, borderRadius: 25, backgroundColor: colores.primario, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
    botonPrincipalTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: "#ffffff" },
  });
}
