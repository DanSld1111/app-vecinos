import { useEffect, useRef, useState } from "react";

/** Paleta fija para el atributo "Color" de un producto — nombre + muestra, en vez de texto libre. */
export const PALETA_COLORES: { clave: string; nombre: string; muestra: string }[] = [
  { clave: "negro", nombre: "Negro", muestra: "#1a1a1a" },
  { clave: "blanco", nombre: "Blanco", muestra: "#ffffff" },
  { clave: "gris", nombre: "Gris", muestra: "#9aa0a6" },
  { clave: "azul", nombre: "Azul", muestra: "#3366cc" },
  { clave: "celeste", nombre: "Celeste", muestra: "#7ec8e3" },
  { clave: "rojo", nombre: "Rojo", muestra: "#c0392b" },
  { clave: "verde", nombre: "Verde", muestra: "#1f8a5a" },
  { clave: "amarillo", nombre: "Amarillo", muestra: "#e8c547" },
  { clave: "naranja", nombre: "Naranja", muestra: "#e07a3f" },
  { clave: "rosado", nombre: "Rosado", muestra: "#e38aa6" },
  { clave: "morado", nombre: "Morado", muestra: "#7c5cbf" },
  { clave: "beige", nombre: "Beige", muestra: "#d8c7a8" },
  { clave: "marron", nombre: "Marrón", muestra: "#7a5230" },
  { clave: "multicolor", nombre: "Multicolor", muestra: "conic-gradient(from 0deg,#c0392b,#e8c547,#1f8a5a,#3366cc,#7c5cbf,#c0392b)" },
];

/** Combo de color con su muestra — usado en el formulario de producto para el atributo "Color". */
export function SelectorColorAtributo({
  valor,
  onCambiar,
}: {
  valor: string;
  onCambiar: (clave: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const actual = PALETA_COLORES.find((c) => c.clave === valor) ?? null;

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
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: actual?.muestra ?? "var(--superficie-hundida)",
              border: "1px solid rgba(0,0,0,.15)",
              flex: "none",
            }}
          />
          {actual ? actual.nombre : "Elegir color"}
        </span>
        <span style={{ color: "var(--texto-tenue)", fontSize: 11 }}>{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto ? (
        <div className="selector-categoria-lista">
          {PALETA_COLORES.map((c) => (
            <div
              key={c.clave}
              className={`selector-categoria-fila ${c.clave === valor ? "activa" : ""}`}
              onClick={() => {
                onCambiar(c.clave);
                setAbierto(false);
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: c.muestra,
                  border: "1px solid rgba(0,0,0,.15)",
                  flex: "none",
                }}
              />
              <span>{c.nombre}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
