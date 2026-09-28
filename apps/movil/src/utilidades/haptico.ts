import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Vibración corta para confirmar una acción que cambia algo tuyo (guardar un favorito, calificar,
 * un "me interesa"). No se usa en navegación ni en toques comunes — si todo vibra, nada significa
 * nada. En web no hace nada (el navegador no expone el motor háptico del teléfono).
 */
export function vibrarLigero() {
  if (Platform.OS === "web") return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Confirmación de que algo se guardó (calificación enviada). */
export function vibrarExito() {
  if (Platform.OS === "web") return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
