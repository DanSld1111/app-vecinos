import { useRef, useState } from "react";
import { Coordenada } from "@app-vecinos/tipos";
import { buscarDireccion, direccionDesdeCoordenada } from "../../utilidades/geocodificacion";
import { SelectorUbicacion } from "./SelectorUbicacion";

/**
 * Dirección de texto + mapa, sincronizados en los dos sentidos: escribir la dirección centra el
 * mapa (geocodificación, al dejar de escribir); mover el pin o hacer clic en el mapa actualiza el
 * texto (geocodificación inversa). Envuelve a SelectorUbicacion — el mapa en sí no cambia.
 */
export function CampoDireccionConMapa({
  direccion,
  coordenada,
  cercaDe,
  onCambiarDireccion,
  onCambiarCoordenada,
}: {
  direccion: string;
  coordenada: Coordenada;
  /** Punto de referencia para priorizar resultados de búsqueda — el centro de la comunidad elegida. */
  cercaDe?: Coordenada;
  onCambiarDireccion: (direccion: string) => void;
  onCambiarCoordenada: (coordenada: Coordenada) => void;
}) {
  const [buscando, setBuscando] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  function alEscribir(texto: string) {
    onCambiarDireccion(texto);
    if (temporizador.current) clearTimeout(temporizador.current);
    // Debounce: geocodificar en cada tecla saturaría Nominatim: se espera a que la persona
    // deje de escribir un momento.
    temporizador.current = setTimeout(async () => {
      if (texto.trim().length < 6) return;
      setBuscando(true);
      const resultado = await buscarDireccion(texto, cercaDe);
      setBuscando(false);
      if (resultado) onCambiarCoordenada(resultado.coordenada);
    }, 900);
  }

  async function alMoverEnMapa(nueva: Coordenada) {
    onCambiarCoordenada(nueva);
    setUbicando(true);
    const texto = await direccionDesdeCoordenada(nueva);
    setUbicando(false);
    if (texto) onCambiarDireccion(texto);
  }

  return (
    <div>
      <div className="campo-modal">
        <label>Dirección</label>
        <input value={direccion} onChange={(e) => alEscribir(e.target.value)} placeholder="Ej. Av. Aviación 2400" />
      </div>
      <div className="campo-modal" style={{ marginBottom: 0 }}>
        <label>
          Ubicación en el mapa{" "}
          {buscando || ubicando ? (
            <span style={{ textTransform: "none", fontWeight: 500, color: "var(--texto-tenue)" }}>
              · sincronizando…
            </span>
          ) : null}
        </label>
        <SelectorUbicacion valor={coordenada} onCambiar={alMoverEnMapa} />
      </div>
    </div>
  );
}
