import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Coordenada } from "@app-vecinos/tipos";

/**
 * Ubicación exacta del negocio: mapa con pin arrastrable **y** coordenadas a mano, los dos
 * sincronizados (mover el pin actualiza los números, pegar números mueve el pin). Se pidieron
 * ambos: el mapa para ajustar a ojo, el pegado para cuando ya tienes las coordenadas copiadas
 * de Google Maps.
 *
 * Leaflet + OpenStreetMap en vez de Google Maps: no necesita clave de API ni cuenta de
 * facturación, que para el piloto es lo que importa.
 */

// Los íconos por defecto de Leaflet se cargan por rutas relativas que Vite no resuelve — se
// dibuja el pin con CSS (divIcon) para no depender de esos archivos.
const PIN = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:var(--verde);transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function normalizar(texto: string): number | null {
  const valor = Number(texto.trim().replace(",", "."));
  return Number.isFinite(valor) ? valor : null;
}

export function SelectorUbicacion({
  valor,
  onCambiar,
}: {
  valor: Coordenada;
  onCambiar: (coordenada: Coordenada) => void;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadorRef = useRef<L.Marker | null>(null);
  // Texto de los inputs aparte del valor real: mientras se escribe "-12.10" el número todavía
  // no es la coordenada final, y no queremos que el mapa salte en cada tecla.
  const [latTexto, setLatTexto] = useState(String(valor.lat));
  const [lngTexto, setLngTexto] = useState(String(valor.lng));
  const [pegado, setPegado] = useState("");
  // true justo antes de un onCambiar propio (arrastrar, clic, texto) — así el efecto de abajo
  // distingue "me moví yo" de "me movieron desde afuera" (ej. al escribir la dirección, que
  // geocodifica y sí debe mover el mapa) sin caer en un loop ni pelear con el arrastre.
  const cambioPropioRef = useRef(false);

  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;
    const mapa = L.map(contenedorRef.current).setView([valor.lat, valor.lng], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapa);

    const marcador = L.marker([valor.lat, valor.lng], { draggable: true, icon: PIN }).addTo(mapa);
    marcador.on("dragend", () => {
      const p = marcador.getLatLng();
      const nueva = { lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) };
      setLatTexto(String(nueva.lat));
      setLngTexto(String(nueva.lng));
      cambioPropioRef.current = true;
      onCambiar(nueva);
    });
    // Un clic en el mapa también mueve el pin — más rápido que arrastrarlo de lejos.
    mapa.on("click", (e: L.LeafletMouseEvent) => {
      const nueva = { lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) };
      marcador.setLatLng(e.latlng);
      setLatTexto(String(nueva.lat));
      setLngTexto(String(nueva.lng));
      cambioPropioRef.current = true;
      onCambiar(nueva);
    });

    mapaRef.current = mapa;
    marcadorRef.current = marcador;
    return () => {
      mapa.remove();
      mapaRef.current = null;
      marcadorRef.current = null;
    };
    // Solo al montar: mover el mapa cuando cambia `valor` lo haría saltar mientras se escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si `valor` cambia desde AFUERA (ej. se geocodificó la dirección que se escribió en otro
  // campo), el mapa sí debe seguirlo. Si el cambio lo originó este mismo componente (arrastrar,
  // clic, texto/pegado — todos marcan cambioPropioRef antes de llamar a onCambiar), se ignora acá
  // para no pelear con el gesto ni hacer saltar el mapa a mitad de una interacción.
  useEffect(() => {
    if (cambioPropioRef.current) {
      cambioPropioRef.current = false;
      return;
    }
    if (!mapaRef.current || !marcadorRef.current) return;
    marcadorRef.current.setLatLng([valor.lat, valor.lng]);
    mapaRef.current.setView([valor.lat, valor.lng], mapaRef.current.getZoom());
    setLatTexto(String(valor.lat));
    setLngTexto(String(valor.lng));
    // Solo depende de la coordenada: si dependiera también de latTexto/lngTexto (que este mismo
    // efecto toca) se dispararía a sí mismo en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor.lat, valor.lng]);

  function moverA(lat: number, lng: number) {
    cambioPropioRef.current = true;
    onCambiar({ lat, lng });
    marcadorRef.current?.setLatLng([lat, lng]);
    mapaRef.current?.setView([lat, lng], mapaRef.current.getZoom());
  }

  function aplicarTexto(latStr: string, lngStr: string) {
    const lat = normalizar(latStr);
    const lng = normalizar(lngStr);
    if (lat === null || lng === null) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    moverA(lat, lng);
  }

  /** Acepta "-12.108, -77.001" tal cual se copia de Google Maps. */
  function aplicarPegado() {
    const partes = pegado.split(/[,\s]+/).filter(Boolean);
    if (partes.length < 2) return;
    const lat = normalizar(partes[0]);
    const lng = normalizar(partes[1]);
    if (lat === null || lng === null) return;
    setLatTexto(String(lat));
    setLngTexto(String(lng));
    moverA(lat, lng);
    setPegado("");
  }

  return (
    <div>
      <div
        ref={contenedorRef}
        style={{ height: 240, borderRadius: 10, overflow: "hidden", border: "1px solid var(--borde)" }}
      />
      <p style={{ fontSize: 11.5, color: "var(--texto-suave)", margin: "8px 0 10px" }}>
        Arrastra el pin o haz clic en el mapa para ajustar la ubicación exacta del negocio.
      </p>

      <div className="fila-2-campos">
        <div className="campo-modal">
          <label>Latitud</label>
          <input
            value={latTexto}
            onChange={(e) => setLatTexto(e.target.value)}
            onBlur={() => aplicarTexto(latTexto, lngTexto)}
            placeholder="-12.1041"
          />
        </div>
        <div className="campo-modal">
          <label>Longitud</label>
          <input
            value={lngTexto}
            onChange={(e) => setLngTexto(e.target.value)}
            onBlur={() => aplicarTexto(latTexto, lngTexto)}
            placeholder="-77.0002"
          />
        </div>
      </div>

      <div className="campo-modal" style={{ marginBottom: 0 }}>
        <label>O pega las coordenadas de Google Maps</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={pegado}
            onChange={(e) => setPegado(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                aplicarPegado();
              }
            }}
            placeholder="-12.1041, -77.0002"
          />
          <button type="button" className="btn-accion-mini" onClick={aplicarPegado} disabled={!pegado.trim()}>
            Ubicar
          </button>
        </div>
      </div>
    </div>
  );
}
