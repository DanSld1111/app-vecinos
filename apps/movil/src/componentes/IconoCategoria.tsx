import { Ionicons } from "@expo/vector-icons";

/** Nombre de ícono de Ionicons (ej. "restaurant-outline") — mismo valor que guarda el panel admin. */
export function IconoCategoria({
  nombre,
  size = 20,
  color,
}: {
  nombre: string;
  size?: number;
  color: string;
}) {
  return <Ionicons name={nombre as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}
