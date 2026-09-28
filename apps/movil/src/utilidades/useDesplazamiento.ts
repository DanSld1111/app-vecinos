import { useEffect, useRef } from "react";
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useBarraPestanas } from "../estado/useBarraPestanas";

const UMBRAL = 8;

/**
 * Para las pantallas con barra de pestañas: devuelve el `onScroll` que esconde la barra al bajar
 * y la vuelve a mostrar al subir (o cerca del tope), y el `scrollY` animado para efectos ligados
 * al desplazamiento (título que se achica, etc.). Al volver a la pantalla la barra reaparece.
 */
export function useDesplazamiento() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const ultimoY = useRef(0);
  const setOculta = useBarraPestanas((e) => e.setOculta);
  const enfocada = useIsFocused();

  useEffect(() => {
    if (enfocada) setOculta(false);
  }, [enfocada, setOculta]);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const delta = y - ultimoY.current;
      if (y < 48) {
        setOculta(false);
        ultimoY.current = y;
      } else if (Math.abs(delta) > UMBRAL) {
        // No se fuerza a mostrarla al llegar al final: en listas cortas eso la hacía aparecer y
        // desaparecer. Las listas ya dejan el alto de la barra libre abajo, así que no tapa nada.
        setOculta(delta > 0);
        ultimoY.current = y;
      }
    },
  });

  return { onScroll, scrollY, scrollEventThrottle: 16 as const };
}

/** Espacio que las listas dejan abajo para no quedar tapadas por la barra de pestañas (que flota encima). */
export function useAlturaBarra(): number {
  return useBarraPestanas((e) => e.altura);
}
