import { useState } from "react";
import { GRUPOS_ICONO, buscarIconos } from "../datos/iconosCategorias";
import { IconoCategoria } from "./IconoCategoria";

export function SelectorIcono({ value, onChange }: { value: string; onChange: (nombre: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState(GRUPOS_ICONO[0].id);
  const [busqueda, setBusqueda] = useState("");

  const iconos = busqueda.trim() ? buscarIconos(busqueda) : GRUPOS_ICONO.find((g) => g.id === tab)?.iconos ?? [];

  return (
    <>
      <button className="selector-icono-boton" onClick={() => setAbierto((v) => !v)} type="button">
        <div className="lado-emoji">
          <div className="emoji-actual">
            <IconoCategoria nombre={value} size={18} />
          </div>
          <span className="txt-cambiar">Cambiar</span>
        </div>
        <span className={`caret ${abierto ? "abierto" : ""}`}>▾</span>
      </button>

      {abierto ? (
        <div className="panel-emojis">
          <div className="buscador-emoji">
            🔍
            <input
              placeholder='Buscar (ej. "auto", "casa", "tienda")…'
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {!busqueda.trim() ? (
            <div className="tabs-emoji">
              {GRUPOS_ICONO.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`tab-emoji ${tab === g.id ? "activo" : ""}`}
                  onClick={() => setTab(g.id)}
                >
                  {g.nombre}
                </button>
              ))}
            </div>
          ) : null}
          <div className="grid-emojis">
            {iconos.map((op) => (
              <button
                key={op.nombre}
                type="button"
                title={op.etiqueta}
                className={`btn-emoji ${value === op.nombre ? "selec" : ""}`}
                onClick={() => {
                  onChange(op.nombre);
                  setAbierto(false);
                  setBusqueda("");
                }}
              >
                <IconoCategoria nombre={op.nombre} size={19} />
              </button>
            ))}
            {iconos.length === 0 ? (
              <span style={{ gridColumn: "1 / -1", fontSize: 11.5, color: "var(--texto-tenue)" }}>
                Sin resultados para "{busqueda}".
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
