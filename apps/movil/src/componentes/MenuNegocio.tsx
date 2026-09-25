import { Image, StyleSheet, Text, View } from "react-native";
import { Moneda, Producto, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { urlCompleta } from "../utilidades/media";
import { EntradaAnimada } from "./EntradaAnimada";

/** Sin foto, un bloque de color en vez de un icono genérico — se alternan por posición, mismo
 * lenguaje visual que el boceto (cada plato "respira" distinto aunque no tenga foto real). */
function colorSwatch(colores: PaletaColores, indice: number) {
  const paleta = [colores.acentoSuave, colores.primarioSuave, colores.superficieHundida2];
  return paleta[indice % paleta.length];
}

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
}: {
  producto: Producto;
  indice: number;
  styles: ReturnType<typeof crearEstilos>;
  colores: PaletaColores;
  moneda: Moneda;
  retraso: number;
}) {
  return (
    <EntradaAnimada retraso={retraso} style={styles.item}>
      {producto.fotoUrl ? (
        <Image source={{ uri: urlCompleta(producto.fotoUrl) }} style={styles.itemImagen} />
      ) : (
        <View style={[styles.itemImagen, { backgroundColor: colorSwatch(colores, indice) }]} />
      )}
      <View style={styles.itemTexto}>
        {producto.destacado ? <Text style={styles.badge}>Más pedido</Text> : null}
        <Text style={styles.itemNombre}>{producto.nombre}</Text>
        <Text style={styles.itemDescripcion} numberOfLines={2}>
          {producto.descripcion}
        </Text>
        <Text style={styles.itemPrecio}>{formatearPrecio(producto.precio, moneda)}</Text>
      </View>
    </EntradaAnimada>
  );
}

export function MenuNegocio({ productos, moneda }: { productos: Producto[]; moneda: Moneda }) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  if (productos.length === 0) return null;
  const grupos = agruparPorCategoria(productos);
  let indiceGlobal = 0;

  return (
    <View>
      <Text style={styles.tituloSeccion}>Menú</Text>
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
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
      marginTop: espaciado.md,
      marginBottom: espaciado.sm,
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
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.acentoFuerte,
      backgroundColor: colores.acentoSuave,
      alignSelf: "flex-start",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radios.sm,
      marginBottom: 2,
      textTransform: "uppercase",
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
  });
}
