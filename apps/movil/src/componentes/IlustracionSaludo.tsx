import Svg, { Circle, Path } from "react-native-svg";
import { useColores } from "../disenio";

export function IlustracionSaludo({ size = 34 }: { size?: number }) {
  const colores = useColores();

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Circle cx={20} cy={20} r={19} fill={colores.primarioSuave} />
      <Path d="M11 24 L16 15 L21 22 L25 16 L29 24 Z" fill={colores.primario} />
      <Circle cx={28} cy={12} r={3.2} fill={colores.acento} />
    </Svg>
  );
}
