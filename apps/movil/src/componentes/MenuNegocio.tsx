import { StyleSheet, Text, View } from "react-native";
import { AtributoProductoDef, Moneda, Producto, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { FotoNegocio } from "./FotoNegocio";
import { EntradaAnimada } from "./EntradaAnimada";
import { atributosVisibles, insigniasDe } from "../utilidades/fichaNegocio";


function agruparPorCategoria(productos: Producto[]) {
  const grupos: { categoria: string; items: Producto[] }[] = [];
  for (const producto of productos) {
    let grupo = grupos.find((g) => g.categoria === producto.categoriaMenu);
    if (!grupo) {
      grupo = { categoria: producto.categoriaMenu, items: [] };
      grupos.push(grupo);
    }
    grupo.items.push(producto);
  }
  return grupos;
}

function ItemMenu({
  producto,
  indice,
  styles,
  colores,
  moneda,
  retraso,
  campos,
}: {
  campos: AtributoProductoDef[];
  producto: Producto;
  indice: number;
  styles: ReturnType<typeof crearEstilos>;
  colores: PaletaColores;
  moneda: Moneda;
  retraso: number;
}) {
  return (
    <EntradaAnimada retraso={retraso} style={styles.item}>
      <FotoNegocio nombre={producto.nombre} url={producto.fotoUrl} style={styles.itemImagen} tamanoIniciales={18} />
      <View style={styles.itemTexto}>
        {producto.destacado || insigniasDe(producto.atributos, campos).length > 0 ? (
          <View style={styles.filaBadges}>
            {producto.destacado ? <Text style={styles.badge}>Más pedido</Text> : null}
            {insigniasDe(producto.atributos, campos).map((i) => (
              <Text key={i} style={styles.insignia}>
                {i}
              </Text>
            ))}
          </View>
        ) : null}
        <Text style={styles.itemNombre}>{producto.nombre}</Text>
        <Text style={styles.itemDescripcion} numberOfLines={2}>
          {producto.descripcion}
        </Text>
        <Text style={styles.itemPrecio}>{formatearPrecio(producto.precio, moneda)}</Text>
        {campos.length > 0 && atributosVisibles(producto.atributos, campos).length > 0 ? (
          <View style={styles.filaAtributos}>
            {atributosVisibles(producto.atributos, campos).map((a) => (
              <Text key={a.clave} style={styles.chipAtributo}>
                {a.texto}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </EntradaAnimada>
  );
}

export function MenuNegocio({
  productos,
  moneda,
  busqueda = "",
  titulo = "Menú",
  campos = [],
}: {
  /** Título de la sección: el que configuró la categoría en el panel, o el de la ficha. */
  titulo?: string;
  /** Campos extra de la categoría (Talla, Color…), para mostrar cada valor con su etiqueta. */
  campos?: AtributoProductoDef[];
  productos: Producto[];
  moneda: Moneda;
  /** Viene del buscador del header de la ficha, no de uno propio — ver app/negocio/[id]/index.tsx. */
  busqueda?: string;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  if (productos.length === 0) return null;
  const termino = busqueda.trim().toLowerCase();
  const filtrados = termino ? productos.filter((p) => p.nombre.toLowerCase().includes(termino)) : productos;
  const grupos = agruparPorCategoria(filtrados);
  let indiceGlobal = 0;

  if (filtrados.length === 0) {
    return (
      <View>
        <Text style={styles.tituloSeccion}>{titulo}</Text>
        <Text style={styles.sinResultados}>Sin resultados para "{busqueda}"</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.tituloSeccion}>{titulo}</Text>
      {grupos.map((grupo) => (
        <View key={grupo.categoria} style={styles.grupo}>
          <Text style={styles.tituloGrupo}>{grupo.categoria}</Text>
          {grupo.items.map((producto) => {
            const indice = indiceGlobal;
            indiceGlobal += 1;
            return (
              <ItemMenu
                key={producto.id}
                producto={producto}
                indice={indice}
                styles={styles}
                colores={colores}
                moneda={moneda}
                retraso={indice * 50}
                campos={campos}
              />
            );
          })}
        </View>
      ))}
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
    grupo: {
      marginBottom: espaciado.md,
    },
    tituloGrupo: {
      ...tipografia.subtitulo,
      fontSize: 15,
      color: colores.texto,
      marginBottom: espaciado.xs,
    },
    item: {
      flexDirection: "row",
      gap: espaciado.md,
      paddingVertical: espaciado.sm,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
    },
    itemImagen: {
      width: 64,
      height: 64,
      borderRadius: radios.sm,
    },
    itemTexto: {
      flex: 1,
      gap: 2,
    },
    badge: {
      ...tipografia.pie,
      fontSize: 10,
      fontFamily: "SchibstedGrotesk_700Bold",
      color: colores.acentoFuerte,
      backgroundColor: colores.acentoSuave,
      alignSelf: "flex-start",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radios.sm,
      marginBottom: 2,
      textTransform: "uppercase",
    },
    filaBadges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    insignia: {
      ...tipografia.pie,
      fontSize: 10,
      fontFamily: "SchibstedGrotesk_700Bold",
      color: colores.primarioFuerte,
      backgroundColor: colores.primarioSuave,
      alignSelf: "flex-start",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radios.sm,
      marginBottom: 2,
      overflow: "hidden",
    },
    itemNombre: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
    },
    itemDescripcion: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    itemPrecio: {
      ...tipografia.cuerpoDestacado,
      color: colores.primarioFuerte,
      marginTop: 2,
    },
    filaAtributos: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 4,
    },
    chipAtributo: {
      ...tipografia.pie,
      fontSize: 11,
      color: colores.textoSuave,
      backgroundColor: colores.superficieHundida,
      borderRadius: radios.sm,
      paddingHorizontal: 6,
      paddingVertical: 1,
      overflow: "hidden",
    },
    sinResultados: {
      ...tipografia.cuerpo,
      color: colores.textoTenue,
      textAlign: "center",
      paddingVertical: espaciado.lg,
    },
  });
}
