export const tipografia = {
  // Schibsted Grotesk en toda la app (dirección "Vitrina", ver docs/decisiones/0060-rediseno-vitrina.md):
  // una sola familia en varios pesos — 800 para nombres y títulos, 400 para leer. Reemplaza a la
  // pareja Fraunces + Plus Jakarta Sans, que es la combinación que hoy usa casi toda app hecha con IA.
  titulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 25, lineHeight: 28, letterSpacing: -0.6 },
  subtitulo: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 16, lineHeight: 21, letterSpacing: -0.2 },
  cuerpo: { fontFamily: "SchibstedGrotesk_400Regular", fontSize: 14, lineHeight: 20 },
  cuerpoDestacado: { fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 14, lineHeight: 20 },
  pie: { fontFamily: "SchibstedGrotesk_400Regular", fontSize: 12, lineHeight: 16 },
  // Solo para rótulos sobre foto ("Oferta de hoy") y el rubro de la ficha — no como título de sección.
  etiqueta: { fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 11, lineHeight: 14, letterSpacing: 0.8 },
  // Los "display" se mantienen como nombres para no tocar cada pantalla, pero ya no son serif.
  display: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 20, lineHeight: 24, letterSpacing: -0.4 },
  displayGrande: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 25, lineHeight: 28, letterSpacing: -0.6 },
  displaySeccion: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 16, lineHeight: 21, letterSpacing: -0.2 },
};
