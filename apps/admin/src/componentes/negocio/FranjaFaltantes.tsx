import { ParteFicha } from "../../utilidades/completitudNegocio";

/**
 * Qué le falta a la ficha de un negocio, arriba de sus pestañas: "A la ficha le falta 1 de 5:
 * horario", con un botón que lleva a completar lo primero que falta. Cuando no falta nada queda
 * una línea verde. Ver decisión 0084.
 */
export function FranjaFaltantes({ partes, onIr }: { partes: ParteFicha[]; onIr: (pestana: ParteFicha["pestana"]) => void }) {
  const faltantes = partes.filter((p) => !p.completa);
  const hechas = partes.length - faltantes.length;
  if (faltantes.length === 0) {
    return (
      <div className="franja-falta completa" role="status">
        ✓{" "}
        <div className="txt">
          <b>Ficha completa.</b> Tiene todo lo que los vecinos necesitan ver.
        </div>
      </div>
    );
  }
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="franja-falta" role="status">
      <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
        <circle cx="19" cy="19" r={r} fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="4" />
        <circle
          cx="19"
          cy="19"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(hechas / partes.length) * c} ${c}`}
          transform="rotate(-90 19 19)"
        />
        <text x="19" y="23" textAnchor="middle" fontSize="11" fontWeight="800" fill="currentColor">
          {hechas}/{partes.length}
        </text>
      </svg>
      <div className="txt">
        A la ficha le falta{" "}
        <b>
          {faltantes.length} de {partes.length}
        </b>
        : {faltantes.map((p) => p.etiqueta).join(", ")}.<small>Los vecinos ven la ficha igual, pero incompleta.</small>
      </div>
      <button type="button" className="btn-completar" onClick={() => onIr(faltantes[0].pestana)}>
        Completar {faltantes[0].etiqueta}
      </button>
    </div>
  );
}
