import { useMemo, useState } from "react";
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AtributoProductoDef, Moneda, Producto, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { urlCompleta } from "../utilidades/media";
import { atributosVisibles, coincideFiltro, filtroDeCampos, insigniasDe } from "../utilidades/fichaNegocio";
import { ChipCategoria } from "./ChipCategoria";
import { SinFoto } from "./SinFoto";
import { EntradaAnimada } from "./EntradaAnimada";

export function CatalogoNegocio({
  productos,
  moneda,
  whatsapp,
  busqueda = "",
  titulo = "Catálogo",
  campos = [],
}: {
  /** Título de la sección: el que configuró la categoría en el panel, o el de la ficha. */
  titulo?: string;
  /** Campos extra de la categoría (Talla, Color…), para mostrar cada valor con su etiqueta. */
  campos?: AtributoProductoDef[];
  productos: Producto[];
  moneda: Moneda;
  /** Para el botón "Consultar por WhatsApp" en el detalle del producto — null si el negocio no puso uno. */
  whatsapp?: string | null;
  /** Viene del buscador del header de la ficha, no de uno propio — ver app/negocio/[id]/index.tsx. */
  busqueda?: string;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const subcategorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoriaMenu))),
    [productos]
  );
  const [filtro, setFiltro] = useState<string | null>(null);
  // Filtro por un campo de la categoría (ej. Especie en Veterinarias), aparte de las secciones.
  const filtroCampo = useMemo(() => filtroDeCampos(campos), [campos]);
  const [opcionCampo, setOpcionCampo] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<Producto | null>(null);

  if (productos.length === 0) return null;

  const termino = busqueda.trim().toLowerCase();
  const visibles = productos.filter((p) => {
    const coincideCategoria = !filtro || p.categoriaMenu === filtro;
    const coincideBusqueda = !termino || p.nombre.toLowerCase().includes(termino);
    const coincideCampo = !filtroCampo || !opcionCampo || coincideFiltro(p.atributos?.[filtroCampo.campo.clave], opcionCampo);
    return coincideCategoria && coincideBusqueda && coincideCampo;
  });

  function alConsultar() {
    if (!whatsapp || !abierto) return;
    Linking.openURL(`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, me interesa "${abierto.nombre}"`)}`);
  }

  return (
    <View>
      <Text style={styles.tituloSeccion}>{titulo}</Text>

      {filtroCampo ? (
        <View style={styles.segmentos} accessibilityRole="tablist" accessibilityLabel={filtroCampo.campo.etiqueta}>
          {[null, ...filtroCampo.opciones].map((opcion) => {
            const activo = opcionCampo === opcion;
            return (
              <Pressable
                key={opcion ?? "todos"}
                accessibilityRole="tab"
                accessibilityState={{ selected: activo }}
                style={[styles.segmento, activo && styles.segmentoActivo]}
                onPress={() => setOpcionCampo(opcion)}
              >
                <Text style={[styles.segmentoTexto, activo && styles.segmentoTextoActivo]} numberOfLines={1}>
                  {opcion ?? "Todos"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {subcategorias.length > 1 ? (
        <View style={styles.filaChips}>
          <ChipCategoria etiqueta="Todo" activo={filtro === null} onPress={() => setFiltro(null)} />
          {subcategorias.map((sub) => (
            <ChipCategoria
              key={sub}
              etiqueta={sub}
              activo={filtro === sub}
              onPress={() => setFiltro(sub)}
            />
          ))}
        </View>
      ) : null}

      {visibles.length === 0 ? (
        <Text style={styles.sinResultados}>
          {termino ? `Sin resultados para "${busqueda}"` : "No hay productos con ese filtro."}
        </Text>
      ) : (
        <View style={styles.grid}>
          {visibles.map((producto, indice) => (
            <EntradaAnimada key={producto.id} retraso={indice * 50} style={styles.tarjetaEnvoltura}>
              <Pressable style={styles.tarjeta} onPress={() => setAbierto(producto)}>
                {producto.fotoUrl ? (
                  <Image source={{ uri: urlCompleta(producto.fotoUrl) }} style={styles.foto} />
                ) : (
                  <SinFoto icono="pricetag-outline" tamanoIcono={22} style={styles.foto} />
                )}
                {insigniasDe(producto.atributos, campos).length > 0 ? (
                  <View style={styles.filaInsignias}>
                    {insigniasDe(producto.atributos, campos).map((i) => (
                      <Text key={i} style={styles.insignia}>
                        {i}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <View style={styles.info}>
                  <Text style={styles.nombre} numberOfLines={1}>
                    {producto.nombre}
                  </Text>
                  <Text style={styles.precio}>{formatearPrecio(producto.precio, moneda)}</Text>
                </View>
              </Pressable>
            </EntradaAnimada>
          ))}
        </View>
      )}

      <Modal visible={abierto !== null} transparent animationType="slide" onRequestClose={() => setAbierto(null)}>
        <Pressable style={styles.fondoHoja} onPress={() => setAbierto(null)}>
          <Pressable style={styles.hoja} onPress={(e) => e.stopPropagation()}>
            {abierto ? (
              <>
                <View style={styles.filaHoja}>
                  {abierto.fotoUrl ? (
                    <Image source={{ uri: urlCompleta(abierto.fotoUrl) }} style={styles.fotoHoja} />
                  ) : (
                    <SinFoto icono="pricetag-outline" tamanoIcono={30} style={styles.fotoHoja} />
                  )}
                  <Pressable style={styles.cerrarHoja} onPress={() => setAbierto(null)}>
                    <Ionicons name="close" size={16} color={colores.texto} />
                  </Pressable>
                </View>
                <Text style={styles.nombreHoja}>{abierto.nombre}</Text>
                <Text style={styles.precioHoja}>{formatearPrecio(abierto.precio, moneda)}</Text>
                {abierto.descripcion ? <Text style={styles.descripcionHoja}>{abierto.descripcion}</Text> : null}
                {insigniasDe(abierto.atributos, campos).length > 0 ? (
                  <View style={styles.filaAtributos}>
                    {insigniasDe(abierto.atributos, campos).map((i) => (
                      <Text key={i} style={styles.insigniaHoja}>
                        {i}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {atributosVisibles(abierto.atributos, campos).length > 0 ? (
                  <View style={styles.filaAtributos}>
                    {atributosVisibles(abierto.atributos, campos).map((a) => (
                      <View key={a.clave} style={styles.chipAtributo}>
                        <Text style={styles.chipAtributoTexto}>{a.texto}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {whatsapp ? (
                  <Pressable style={styles.botonWhatsapp} onPress={alConsultar}>
                    <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                    <Text style={styles.botonWhatsappTexto}>Consultar por WhatsApp</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tituloSeccion: {
      ...tipografia.subtitulo,
      color: colores.texto,
      marginTop: espaciado.lg,
      marginBottom: espaciado.xs,
    },
    segmentos: {
      flexDirection: "row",
      gap: 4,
      padding: 4,
      borderRadius: radios.md,
      backgroundColor: colores.superficieHundida,
      marginBottom: espaciado.sm,
    },
    segmento: {
      flex: 1,
      minHeight: 38,
      borderRadius: radios.sm,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    segmentoActivo: {
      backgroundColor: colores.superficie,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    segmentoTexto: {
      ...tipografia.pie,
      fontSize: 13,
      fontFamily: "SchibstedGrotesk_600SemiBold",
      color: colores.textoSuave,
    },
    segmentoTextoActivo: {
      fontFamily: "SchibstedGrotesk_800ExtraBold",
      color: colores.texto,
    },
    filaInsignias: {
      position: "absolute",
      top: 8,
      left: 8,
      flexDirection: "row",
      gap: 4,
    },
    insignia: {
      ...tipografia.pie,
      fontSize: 11,
      fontFamily: "SchibstedGrotesk_700Bold",
      color: colores.texto,
      backgroundColor: colores.superficie,
      borderWidth: 1,
      borderColor: colores.bordeFuerte,
      borderRadius: radios.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
      overflow: "hidden",
    },
    insigniaHoja: {
      ...tipografia.pie,
      fontSize: 12,
      fontFamily: "SchibstedGrotesk_700Bold",
      color: colores.primarioFuerte,
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.sm,
      paddingHorizontal: espaciado.sm,
      paddingVertical: 4,
      overflow: "hidden",
    },
    filaChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
      marginBottom: espaciado.md,
    },
    sinResultados: {
      ...tipografia.cuerpo,
      color: colores.textoTenue,
      textAlign: "center",
      paddingVertical: espaciado.lg,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
    },
    tarjetaEnvoltura: {
      width: "48%",
    },
    tarjeta: {
      borderRadius: radios.md,
      borderWidth: 1,
      borderColor: colores.borde,
      overflow: "hidden",
    },
    foto: {
      width: "100%",
      aspectRatio: 1,
    },
    info: {
      padding: espaciado.sm,
      gap: 2,
    },
    nombre: {
      ...tipografia.pie,
      fontFamily: "SchibstedGrotesk_700Bold",
      color: colores.texto,
    },
    precio: {
      ...tipografia.cuerpoDestacado,
      fontSize: 13,
      color: colores.primarioFuerte,
    },
    fondoHoja: {
      flex: 1,
      backgroundColor: "rgba(15,20,15,0.45)",
      justifyContent: "flex-end",
    },
    hoja: {
      backgroundColor: colores.superficie,
      borderTopLeftRadius: radios.lg + 8,
      borderTopRightRadius: radios.lg + 8,
      padding: espaciado.lg,
      gap: espaciado.sm,
    },
    filaHoja: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    fotoHoja: {
      width: 120,
      height: 120,
      borderRadius: radios.lg,
    },
    cerrarHoja: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
    nombreHoja: {
      ...tipografia.display,
      fontSize: 18,
      color: colores.texto,
    },
    precioHoja: {
      ...tipografia.displaySeccion,
      color: colores.primarioFuerte,
    },
    descripcionHoja: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
    },
    filaAtributos: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.xs,
    },
    chipAtributo: {
      backgroundColor: colores.superficieHundida,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: radios.sm,
      paddingHorizontal: espaciado.sm,
      paddingVertical: 5,
    },
    chipAtributoTexto: {
      ...tipografia.pie,
      fontSize: 11,
      fontFamily: "SchibstedGrotesk_600SemiBold",
      color: colores.textoSuave,
    },
    botonWhatsapp: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: espaciado.xs,
      backgroundColor: colores.primario,
      borderRadius: radios.md,
      paddingVertical: espaciado.sm + 2,
      marginTop: espaciado.xs,
    },
    botonWhatsappTexto: {
      ...tipografia.cuerpoDestacado,
      color: "#ffffff",
    },
  });
}
