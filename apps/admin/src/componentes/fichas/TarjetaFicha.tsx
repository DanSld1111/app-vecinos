import { FICHAS, TipoFicha } from "@app-vecinos/tipos";
import { LuCheck } from "react-icons/lu";

/** Un dibujo esquemático de cada ficha, para reconocerla de un vistazo sin leer el nombre. */
function Miniatura({ ficha }: { ficha: TipoFicha }) {
  const fila = (i: number, conFoto: boolean) => (
    <div className="mf-fila" key={i}>
      {conFoto ? <span className="mf-cuad" /> : null}
      <span className="mf-lin" />
      <span className="mf-lin precio" />
    </div>
  );
  switch (ficha) {
    case "menu":
      return <>{[0, 1, 2].map((i) => fila(i, true))}</>;
    case "servicios":
      return <>{[0, 1, 2, 3].map((i) => fila(i, false))}</>;
    case "catalogo":
      return (
        <div className="mf-grid">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="mf-caja" />
          ))}
        </div>
      );
    case "rubros":
      return (
        <div className="mf-chips">
          {[40, 30, 24, 34, 44].map((w) => (
            <span key={w} className="mf-chip" style={{ width: `${w}%` }} />
          ))}
        </div>
      );
    case "ofertas":
      return (
        <>
          <div className="mf-grid tres bajo">
            {[0, 1, 2].map((i) => (
              <span key={i} className="mf-caja" />
            ))}
          </div>
          <div className="mf-chips">
            {[30, 26, 34].map((w) => (
              <span key={w} className="mf-chip" style={{ width: `${w}%` }} />
            ))}
          </div>
        </>
      );
    case "galeria":
      return (
        <div className="mf-grid tres">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="mf-caja" />
          ))}
        </div>
      );
  }
}

/** Tarjeta elegible de una ficha. `compacta` = solo dibujo y nombre (para elegir en un formulario). */
export function TarjetaFicha({
  ficha,
  seleccionada,
  compacta = false,
  uso,
  onElegir,
}: {
  ficha: TipoFicha;
  seleccionada: boolean;
  compacta?: boolean;
  /** Texto de dónde se usa, solo en la versión completa. */
  uso?: string;
  onElegir: () => void;
}) {
  const info = FICHAS[ficha];
  return (
    <button
      type="button"
      className={`tarjeta-ficha ${compacta ? "compacta" : ""}`}
      aria-pressed={seleccionada}
      onClick={onElegir}
    >
      {seleccionada ? (
        <span className="marca-ficha">
          <LuCheck />
        </span>
      ) : null}
      <span className="miniatura-ficha">
        <Miniatura ficha={ficha} />
      </span>
      <b>{info.nombre}</b>
      {compacta ? null : <span className="desc-ficha">{info.descripcion}</span>}
      {!compacta && uso ? <span className="uso-ficha">{uso}</span> : null}
    </button>
  );
}
