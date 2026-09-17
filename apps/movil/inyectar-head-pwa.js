// Agrega al <head> de dist/index.html lo que expo-router NO agrega en modo de export "single"
// (el default de este proyecto): íconos y comportamiento de "Agregar a pantalla de inicio" en
// iPhone/Android. La forma "oficial" de Expo Router para esto es app/+html.tsx, pero requiere
// activar "output": "static" en app.json — probado y descartado (ver docs/decisiones): en este
// monorepo (npm workspaces) esa opción rompe el build entero porque un paquete interno de Expo
// (@expo/router-server, anidado varios niveles dentro de node_modules/expo) no logra resolver
// "expo-router/internal/static" — no es algo que se pueda arreglar sin tocar Expo. Inyectar
// las etiquetas después del build normal logra el mismo resultado sin ese riesgo.
//
// Uso: node inyectar-head-pwa.js (se corre automático al final de "npm run build", ver package.json)
const fs = require("fs");
const path = require("path");

const RUTA_INDEX = path.join(__dirname, "dist", "index.html");
const VERDE_MARCA = "#1a531a";

const TAMANOS_SPLASH = [
  { archivo: "splash-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
  { archivo: "splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
  { archivo: "splash-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
  { archivo: "splash-1284x2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
  { archivo: "splash-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
  { archivo: "splash-1242x2688.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" },
  { archivo: "splash-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
  { archivo: "splash-1242x2208.png", media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" },
  { archivo: "splash-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
];

const etiquetas = [
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="ELISUR">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  '<link rel="manifest" href="/manifest.json">',
  ...TAMANOS_SPLASH.map((s) => `<link rel="apple-touch-startup-image" href="/${s.archivo}" media="${s.media}">`),
  // Mismo verde de marca desde antes de que cargue el bundle — evita el flash blanco entre la
  // splash screen de iOS y el primer render real.
  `<style>html,body{background-color:${VERDE_MARCA}}</style>`,
].join("\n");

let html = fs.readFileSync(RUTA_INDEX, "utf8");

if (html.includes("apple-mobile-web-app-capable")) {
  console.log("inyectar-head-pwa: ya estaban las etiquetas, no se duplica.");
  process.exit(0);
}

html = html.replace('<html lang="en">', '<html lang="es">');

// viewport-fit=cover: sin esto, env(safe-area-inset-*) queda en 0 — la barra de tabs y los
// headers no tendrían de dónde leer el alto real del notch/Dynamic Island/home indicator.
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

html = html.replace("</head>", `${etiquetas}\n</head>`);

fs.writeFileSync(RUTA_INDEX, html);
console.log("inyectar-head-pwa: etiquetas de PWA/iOS agregadas a dist/index.html");
