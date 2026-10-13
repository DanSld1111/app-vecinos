import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Versión del panel (decisión 0095): el commit que despliega Vercel. Va dentro del bundle y en
// /version.json; el panel abierto compara las dos para avisar que hay una versión nueva.
const VERSION_PANEL = (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 12) || `local-${Date.now().toString(36)}`;

function archivoVersion(): Plugin {
  return {
    name: "version-panel",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version: VERSION_PANEL }) });
    },
  };
}

export default defineConfig({
  plugins: [react(), archivoVersion()],
  define: {
    __VERSION_PANEL__: JSON.stringify(VERSION_PANEL),
  },
  server: {
    port: 5183,
  },
});
