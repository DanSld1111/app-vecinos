import { useEffect, useRef, useState } from "react";
import { Categoria } from "@app-vecinos/tipos";
import { IconoCategoria } from "../IconoCategoria";

/**
 * Categoría como listado desplegable en vez de una fila de chips: con 14 categorías (y
 * creciendo) una fila de botones se amontona, un listado escala igual con 14 que con 40.
 * Mantiene los íconos reales de cada categoría (los mismos que usa el resto del panel).
 */
export function SelectorCategoria({
  categorias,
  valor,
  onCambiar,
  placeholder = "Elegir categoría",
}: {
  categorias: Categoria[];
  valor: string;
  onCambiar: (categoriaId: string) => void;
  placeholder?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const actual = categorias.find((c) => c.id === valor) ?? null;

  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, []);

  return (
    <div ref={contenedorRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="selector-categoria-boton"
        onClick={() => setAbierto((v) => !v)}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {actual ? <IconoCategoria nombre={actual.icono} size={16} /> : null}
          {actual ? actual.nombre : placeholder}
        </span>
        <span style={{ color: "var(--texto-tenue)", fontSize: 11 }}>{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto ? (
        <div className="selector-categoria-lista">
          {categorias.map((c) => (
            <div
              key={c.id}
              className={`selector-categoria-fila ${c.id === valor ? "activa" : ""}`}
              onClick={() => {
                onCambiar(c.id);
                setAbierto(false);
              }}
            >
              <IconoCategoria nombre={c.icono} size={16} />
              <span>{c.nombre}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
