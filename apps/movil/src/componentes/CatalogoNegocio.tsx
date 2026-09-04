import { useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Producto } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { urlCompleta } from "../utilidades/media";
import { ChipCategoria } from "./ChipCategoria";
import { SinFoto } from "./SinFoto";

function formatearPrecio(precio: number) {
  return `S/ ${precio % 1 === 0 ? precio.toFixed(0) : precio.toFixed(2)}`;
}

export function CatalogoNegocio({ productos }: { productos: Producto[] }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const subcategorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoriaMenu))),
    [productos]
  );
  const [filtro, setFiltro] = useState<string | null>(null);

  if (productos.length === 0) return null;
  const visibles = filtro ? productos.filter((p) => p.categoriaMenu === filtro) : productos;

  return (
    <View>
      <Text style={styles.tituloSeccion}>Catálogo</Text>
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
      <View style={styles.grid}>
        {visibles.map((producto) => (
          <View key={producto.id} style={styles.tarjeta}>
            {producto.fotoUrl ? (
              <Image source={{ uri: urlCompleta(producto.fotoUrl) }} style={styles.foto} />
            ) : (
              <SinFoto icono="pricetag-outline" tamanoIcono={22} style={styles.foto} />
            )}
            <View style={styles.info}>
              <Text style={styles.nombre} numberOfLines={1}>
                {producto.nombre}
              </Text>
              <Text style={styles.precio}>{formatearPrecio(producto.precio)}</Text>
            </View>
          </View>
        ))}
      </View>
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
    filaChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
      marginBottom: espaciado.md,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
    },
    tarjeta: {
      width: "48%",
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
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.texto,
    },
    precio: {
      ...tipografia.cuerpoDestacado,
      fontSize: 13,
      color: colores.primarioFuerte,
    },
  });
}
