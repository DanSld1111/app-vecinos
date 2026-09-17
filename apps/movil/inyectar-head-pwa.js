// Agrega al <head>/<body> de dist/index.html lo que expo-router NO agrega en modo de export
// "single" (el default de este proyecto): íconos y comportamiento de "Agregar a pantalla de
// inicio" en iPhone/Android, más una pantalla de carga animada mientras el bundle de React
// (2MB+) todavía no terminó de cargar/ejecutar. La forma "oficial" de Expo Router para lo
// primero es app/+html.tsx, pero requiere activar "output": "static" en app.json — probado y
// descartado (ver docs/decisiones/0055): en este monorepo esa opción rompe el build entero
// porque un paquete interno de Expo no logra resolver "expo-router/internal/static". Inyectar
// después del build normal logra el mismo resultado sin ese riesgo.
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
  // splash screen de iOS y el primer render real. Se retira apenas la app monta (ver script
  // más abajo): dejarlo para siempre es lo que causaba la franja verde bajo la barra de tabs
  // (decisión 0058) — cualquier zona que la app no pinte de por sí queda mostrando este verde
  // en vez del fondo real (blanco en modo claro, casi negro en oscuro).
  `<style id="carga-elisur-fondo">html,body{background-color:${VERDE_MARCA}}</style>`,
].join("\n");

// Pantalla de carga: mismo isotipo de marca (la "E" + la hoja, ver IlustracionSaludo.tsx) pero
// animado — la "E" se dibuja con un trazo y la hoja "brota" desde su punta, en loop, mientras
// el bundle de React (2MB+) todavía está cargando/ejecutando. Un <script> mínimo (sin
// dependencias, corre antes que el bundle grande) la retira apenas #root tiene contenido real.
const PANTALLA_CARGA = `
<div id="carga-elisur" aria-hidden="true">
  <svg width="96" height="96" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path id="carga-elisur-e" d="M13 11 H23 M13 11 V29 M13 20 H20 M13 29 H21"
      stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="100" />
    <path id="carga-elisur-hoja" d="M21 21 C21 15 26 11.5 31 10.5 C29.5 16 26 20 21 21 Z" fill="#fff" />
  </svg>
</div>
<style>
  #carga-elisur {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background-color: ${VERDE_MARCA};
    animation: carga-elisur-ciclo 2.6s ease-in-out infinite;
  }
  #carga-elisur.oculto { opacity: 0; pointer-events: none; transition: opacity .45s ease; animation: none; }
  #carga-elisur-e {
    stroke-dashoffset: 100;
    animation: carga-elisur-trazo 2.6s cubic-bezier(.65,0,.35,1) infinite;
  }
  #carga-elisur-hoja {
    transform-origin: 21px 21px;
    transform: scale(0);
    opacity: 0;
    animation: carga-elisur-brote 2.6s cubic-bezier(.34,1.56,.64,1) infinite;
  }
  @keyframes carga-elisur-ciclo {
    0% { opacity: 0; } 8% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; }
  }
  @keyframes carga-elisur-trazo {
    0%, 8% { stroke-dashoffset: 100; } 35% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; }
  }
  @keyframes carga-elisur-brote {
    0%, 30% { transform: scale(0); opacity: 0; }
    32% { opacity: 1; }
    50% { transform: scale(1.08); }
    60%, 100% { transform: scale(1); opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    #carga-elisur, #carga-elisur-e, #carga-elisur-hoja { animation: none; }
    #carga-elisur-e { stroke-dashoffset: 0; }
    #carga-elisur-hoja { transform: scale(1); opacity: 1; }
  }
</style>
<script>
  (function () {
    function verificar() {
      var raiz = document.getElementById("root");
      var carga = document.getElementById("carga-elisur");
      if (!carga) return;
      if (raiz && raiz.children.length > 0) {
        carga.classList.add("oculto");
        setTimeout(function () { carga.remove(); }, 500);
        var fondo = document.getElementById("carga-elisur-fondo");
        if (fondo) fondo.remove();
      } else {
        requestAnimationFrame(verificar);
      }
    }
    requestAnimationFrame(verificar);
  })();
</script>
`.trim();

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

// Antes de <div id="root">, no después — así queda pintada encima apenas el HTML se parsea,
// sin esperar nada de JS.
html = html.replace('<div id="root"></div>', `${PANTALLA_CARGA}\n<div id="root"></div>`);

fs.writeFileSync(RUTA_INDEX, html);
console.log("inyectar-head-pwa: etiquetas de PWA/iOS + pantalla de carga agregadas a dist/index.html");
