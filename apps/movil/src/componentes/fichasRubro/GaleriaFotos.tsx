import { useState } from "react";
import { Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import { SinFoto } from "../SinFoto";

/** Fotos deslizables a todo el ancho, con "2/8" (decisión 0096). */
export function GaleriaFotos({ fotos, alto, ancho, icono = "image-outline" }: { fotos: string[]; alto: number; ancho: number; icono?: string }) {
  const [pagina, setPagina] = useState(0);
  if (!fotos.length) return <SinFoto icono={icono as never} tamanoIcono={30} style={{ width: ancho, height: alto }} />;
  const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPagina(Math.round(e.nativeEvent.contentOffset.x / ancho));
  return (
    <View style={{ width: ancho, height: alto }}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={alDesplazar} scrollEventThrottle={32}>
        {fotos.map((f, i) => (
          <Image key={f + i} source={{ uri: f }} style={{ width: ancho, height: alto }} resizeMode="cover" accessibilityLabel={`Foto ${i + 1} de ${fotos.length}`} />
        ))}
      </ScrollView>
      {fotos.length > 1 ? (
        <Text style={styles.contador}>
          {pagina + 1}/{fotos.length}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contador: {
    position: "absolute",
    right: 12,
    bottom: 12,
    color: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontFamily: "SchibstedGrotesk_700Bold",
    fontSize: 12.5,
    overflow: "hidden",
  },
});
