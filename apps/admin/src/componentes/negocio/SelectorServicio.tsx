import { useEffect, useRef, useState } from "react";
import { ServicioApp } from "@app-vecinos/tipos";

/** Mismo criterio que IconoServicio en la app móvil (emoji fijo por slug) — acá basta un emoji,
 * no hace falta el SVG propio del móvil. */
const EMOJI_POR_SLUG: Record<string, string> = {
  negocios: "🔎",
  restaurantes: "🍽️",
  "market-space": "🛍️",
  supermarket: "🛒",
  inmobiliaria: "🏠",
  turismo: "✈️",
  "rescate-animal": "🐾",
  consultorias: "🧾",
  otros: "🗂️",
  "bolsa-empleo": "💼",
  "bolsa-puntos": "⭐",
  taxi: "🚕",
};

/** Servicio como listado desplegable, mismo patrón que SelectorCategoria — solo se ofrecen los
 * servicios que ya tienen al menos una categoría asignada (los demás no son directorios de
 * negocio, ver docs/decisiones/0072-servicio-dueno-de-categoria.md). */
export function SelectorServicio({
  servicios,
  valor,
  onCambiar,
  placeholder = "Elegir servicio",
}: {
  servicios: ServicioApp[];
  valor: string;
  onCambiar: (servicioSlug: string) => void;
  placeholder?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const actual = servicios.find((s) => s.slug === valor) ?? null;

  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, []);

  return (
    <div ref={contenedorRef} style={{ position: "relative" }}>
      <button type="button" className="selector-categoria-boton" onClick={() => setAbierto((v) => !v)}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {actual ? <span>{EMOJI_POR_SLUG[actual.slug] ?? "🏷️"}</span> : null}
          {actual ? actual.nombre : placeholder}
        </span>
        <span style={{ color: "var(--texto-tenue)", fontSize: 11 }}>{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto ? (
        <div className="selector-categoria-lista">
          {servicios.map((s) => (
            <div
              key={s.slug}
              className={`selector-categoria-fila ${s.slug === valor ? "activa" : ""}`}
              onClick={() => {
                onCambiar(s.slug);
                setAbierto(false);
              }}
            >
              <span>{EMOJI_POR_SLUG[s.slug] ?? "🏷️"}</span>
              <span>{s.nombre}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
