import Svg, { Path, Rect } from "react-native-svg";
import { useColores } from "../disenio";

// Versión vectorial simplificada del isotipo de marca (la "E" con la hoja) — se
// mantiene nítida a cualquier tamaño y sigue los colores del tema (claro/oscuro),
// a diferencia de un PNG fijo. Ver assets/icono-app.png para la versión de marca completa.
export function IlustracionSaludo({ size = 34 }: { size?: number }) {
  const colores = useColores();

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Rect x={2} y={2} width={36} height={36} rx={10} fill={colores.primario} />
      <Path
        d="M13 11 H23 M13 11 V29 M13 20 H20 M13 29 H21"
        stroke="#fff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M21 21 C21 15 26 11.5 31 10.5 C29.5 16 26 20 21 21 Z" fill="#fff" />
    </Svg>
  );
}
