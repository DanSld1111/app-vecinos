// Build web de la app (decisión 0095). Igual que antes (expo export + inyectar-head-pwa.js), más
// un número de versión: se mete en el bundle (EXPO_PUBLIC_VERSION_APP) y se publica en
// dist/version.json. La app abierta compara los dos para saber cuándo hay una versión nueva y
// recargarse sola, sin que el vecino tenga que cerrarla.
//
// Uso: npm run build (Vercel lo corre en cada despliegue).
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const version = (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 12) || `local-${Date.now().toString(36)}`;
console.log(`Versión de la app: ${version}`);

execSync("expo export --platform web", { stdio: "inherit", env: { ...process.env, EXPO_PUBLIC_VERSION_APP: version } });
fs.writeFileSync(path.join(__dirname, "dist", "version.json"), JSON.stringify({ version }));
execSync("node inyectar-head-pwa.js", { stdio: "inherit", cwd: __dirname });
