import { Moneda, NOMBRE_MONEDA, SIMBOLO_MONEDA } from "@app-vecinos/tipos";

const MONEDAS: Moneda[] = ["PEN", "USD", "EUR"];

/**
 * La moneda de un precio (producto, oferta o servicio): S/, $ o €. Sin elegir nada vale la del
 * negocio; elegir la del negocio vuelve a "sin moneda propia" (null), así si el negocio cambia de
 * moneda, ese precio cambia con él. Ver docs/decisiones/0090.
 */
export function SelectorMoneda({
  valor,
  monedaNegocio,
  onCambiar,
  etiqueta = "Moneda",
}: {
  valor: Moneda | null | undefined;
  monedaNegocio: Moneda;
  onCambiar: (moneda: Moneda | null) => void;
  etiqueta?: string;
}) {
  return (
    <select
      className="selector-moneda"
      aria-label={etiqueta}
      title={`${NOMBRE_MONEDA[valor ?? monedaNegocio]}${valor && valor !== monedaNegocio ? "" : " (la del negocio)"}`}
      value={valor ?? monedaNegocio}
      onChange={(e) => {
        const m = e.target.value as Moneda;
        onCambiar(m === monedaNegocio ? null : m);
      }}
    >
      {MONEDAS.map((m) => (
        <option key={m} value={m} title={NOMBRE_MONEDA[m]}>
          {SIMBOLO_MONEDA[m]}
        </option>
      ))}
    </select>
  );
}
