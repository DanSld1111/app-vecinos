import { Image, StyleSheet, Text, View } from "react-native";
import { Producto } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { urlCompleta } from "../utilidades/media";
import { SinFoto } from "./SinFoto";

function formatearPrecio(precio: number) {
  return `S/ ${precio % 1 === 0 ? precio.toFixed(0) : precio.toFixed(2)}`;
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

function ItemMenu({ producto, styles }: { producto: Producto; styles: ReturnType<typeof crearEstilos> }) {
  return (
    <View style={styles.item}>
      {producto.fotoUrl ? (
        <Image source={{ uri: urlCompleta(producto.fotoUrl) }} style={styles.itemImagen} />
      ) : (
        <SinFoto icono="fast-food-outline" tamanoIcono={20} style={styles.itemImagen} />
      )}
      <View style={styles.itemTexto}>
        {producto.destacado ? <Text style={styles.badge}>Más pedido</Text> : null}
        <Text style={styles.itemNombre}>{producto.nombre}</Text>
        <Text style={styles.itemDescripcion} numberOfLines={2}>
          {producto.descripcion}
        </Text>
        <Text style={styles.itemPrecio}>{formatearPrecio(producto.precio)}</Text>
      </View>
    </View>
  );
}

export function MenuNegocio({ productos }: { productos: Producto[] }) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  if (productos.length === 0) return null;
  const grupos = agruparPorCategoria(productos);

  return (
    <View>
      <Text style={styles.tituloSeccion}>Menú</Text>
      {grupos.map((grupo) => (
        <View key={grupo.categoria} style={styles.grupo}>
          <Text style={styles.tituloGrupo}>{grupo.categoria}</Text>
          {grupo.items.map((producto) => (
            <ItemMenu key={producto.id} producto={producto} styles={styles} />
          ))}
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
