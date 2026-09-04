import { REGISTRO_ICONOS } from "./registroIconos";

export function IconoCategoria({
  nombre,
  size = 20,
  color = "currentColor",
}: {
  nombre: string;
  size?: number;
  color?: string;
}) {
  const Icono = REGISTRO_ICONOS[nombre] ?? REGISTRO_ICONOS["ellipse-outline"];
  return <Icono size={size} color={color} />;
}
