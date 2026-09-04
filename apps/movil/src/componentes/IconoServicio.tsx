import Svg, { Circle, Path, Rect } from "react-native-svg";

type PropsIcono = { size: number; color: string };

function IconoNegocios({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconoRestaurantes({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3v6M9 3v6M6 9a2 2 0 004 0M7.5 9v12M15 3c-1.7 0-3 2.1-3 5.5S13.3 13 15 13s3-.9 3-4.5S16.7 3 15 3zM15 13v8"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconoMarketSpace({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8l1.5-4h13L20 8M4 8h16M4 8l1 11a1 1 0 001 1h12a1 1 0 001-1l1-11M9 12a3 3 0 006 0"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconoSupermarket({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 4h2l1.5 11h11L19 8H6.2M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconoRescateAnimal({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20c1-4 4-6 8-6s7 2 8 6M12 13a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconoTurismo({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 13l7-2 4-8 2 1-2 7 7-2 1 2-7 4 2 7-2 1-4-6-5 5-2-1 3-6-6-1z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconoInmobiliaria({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

function IconoTaxi({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={10} width={18} height={7} rx={1.5} stroke={color} strokeWidth={1.5} />
      <Circle cx={7.5} cy={17.5} r={1.6} stroke={color} strokeWidth={1.4} />
      <Circle cx={16.5} cy={17.5} r={1.6} stroke={color} strokeWidth={1.4} />
      <Path d="M5 10l1.5-4h11L19 10" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

function IconoConsultorias({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 4h6v3H9zM4 8h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

function IconoBolsaEmpleo({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 4h6v3H9zM4 8h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M9 13h6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function IconoBolsaPuntos({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12a8 8 0 11-8-8M20 4l-8 8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconoOtros({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={6} cy={12} r={1.6} fill={color} />
      <Circle cx={12} cy={12} r={1.6} fill={color} />
      <Circle cx={18} cy={12} r={1.6} fill={color} />
    </Svg>
  );
}

function IconoEstrella({ size, color }: PropsIcono) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.4L12 16.8 5.7 21.2 8 13.8 2 9.4h7.6z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const ICONOS_SERVICIO = {
  negocios: IconoNegocios,
  restaurantes: IconoRestaurantes,
  "market-space": IconoMarketSpace,
  supermarket: IconoSupermarket,
  "rescate-animal": IconoRescateAnimal,
  turismo: IconoTurismo,
  inmobiliaria: IconoInmobiliaria,
  taxi: IconoTaxi,
  consultorias: IconoConsultorias,
  "bolsa-empleo": IconoBolsaEmpleo,
  "bolsa-puntos": IconoBolsaPuntos,
  otros: IconoOtros,
  estrella: IconoEstrella,
} as const;

export type SlugIconoServicio = keyof typeof ICONOS_SERVICIO;

export function IconoServicio({
  slug,
  size = 20,
  color,
}: {
  slug: SlugIconoServicio;
  size?: number;
  color: string;
}) {
  const Icono = ICONOS_SERVICIO[slug];
  return <Icono size={size} color={color} />;
}
