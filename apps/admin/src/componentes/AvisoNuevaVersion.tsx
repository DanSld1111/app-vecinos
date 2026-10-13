import { useEffect, useState } from "react";
import { LuSparkles } from "react-icons/lu";

declare const __VERSION_PANEL__: string;

const CADA_MS = 5 * 60 * 1000;

async function versionPublicada(): Promise<string | null> {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return null;
    return ((await r.json()) as { version?: string }).version ?? null;
  } catch {
    return null;
  }
}

/**
 * Versión nueva del panel publicada (decisión 0095). A diferencia de la app, aquí no se recarga
 * solo: podría haber un formulario a medio llenar. Solo avisa y recarga cuando se toca el botón.
 */
export function AvisoNuevaVersion() {
  const [hayNueva, setHayNueva] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    const revisar = async () => {
      const publicada = await versionPublicada();
      if (publicada && publicada !== __VERSION_PANEL__) setHayNueva(true);
    };
    const alCambiarVisibilidad = () => document.visibilityState === "visible" && revisar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    const primera = setTimeout(revisar, 15000);
    const intervalo = setInterval(() => document.visibilityState === "visible" && revisar(), CADA_MS);
    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      clearTimeout(primera);
      clearInterval(intervalo);
    };
  }, []);

  if (!hayNueva) return null;
  return (
    <div className="aviso-nueva-version" role="status">
      <LuSparkles aria-hidden />
      <span>Hay una versión nueva del panel. Guarda lo que estés haciendo y actualiza.</span>
      <button type="button" onClick={() => window.location.reload()}>
        Actualizar
      </button>
      <button type="button" className="cerrar-aviso-version" aria-label="Recordarme después" onClick={() => setHayNueva(false)}>
        Después
      </button>
    </div>
  );
}
