import { useState } from "react";
import { Categoria, Negocio } from "@app-vecinos/tipos";
import { useNegocios } from "../../estado/useNegocios";
import { useCategorias } from "../../estado/useCategorias";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { cambiosDesdeRechazo } from "../../utilidades/cambiosRechazo";

/**
 * Reenviar a revisión un negocio rechazado (decisión 0086): muestra el motivo, qué cambió desde
 * el rechazo y deja una nota para el validador. Si no cambió nada, avisa (se puede reenviar igual).
 */
export function ModalReenviar({ negocio, onCerrar }: { negocio: Negocio; onCerrar: (reenviado: boolean) => void }) {
  const token = useSesionAdmin((e) => e.token)!;
  const reenviar = useNegocios((e) => e.reenviar);
  const categorias = useCategorias((e) => e.categorias) as Categoria[];
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const motivo = negocio.motivoRechazo ?? negocio.versionRechazada?.motivoRechazo ?? null;
  const cambios = cambiosDesdeRechazo(negocio, categorias);

  async function confirmar() {
    setEnviando(true);
    const ok = await reenviar(negocio.id, nota, token);
    setEnviando(false);
    if (ok) onCerrar(true);
  }

  return (
    <div className="overlay-modal" onClick={() => onCerrar(false)}>
      <div className="modal-card modal-reenviar" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="titulo-reenviar">
        <h3 id="titulo-reenviar">Reenviar “{negocio.nombre}” a revisión</h3>
        <p className="sub">Vuelve a la cola del validador con lo que corregiste.</p>
        {motivo ? (
          <div className="motivo-reenvio">
            <b>Motivo del rechazo:</b> {motivo}
          </div>
        ) : null}

        {cambios === null ? null : cambios.length ? (
          <table className="tabla-cambios-reenvio">
            <thead>
              <tr>
                <th>Qué cambió</th>
                <th>Rechazado</th>
                <th>Ahora</th>
              </tr>
            </thead>
            <tbody>
              {cambios.map((c) => (
                <tr key={c.campo}>
                  <td>{c.campo}</td>
                  <td className="antes">{c.antes}</td>
                  <td className="ahora">{c.ahora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="nota-alerta">Todavía no cambiaste nada desde el rechazo. Puedes reenviarlo igual si lo que faltaba no está en la ficha (por ejemplo, productos).</p>
        )}

        <div className="campo-modal">
          <label htmlFor="nota-reenvio">Nota para el validador (opcional)</label>
          <textarea
            id="nota-reenvio"
            rows={3}
            maxLength={500}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. Ya subí la foto del local y agregué el horario del domingo."
          />
        </div>
        <div className="modal-footer">
          <button className="btn-cancelar" onClick={() => onCerrar(false)}>
            Cancelar
          </button>
          <button className="btn-crear" disabled={enviando} onClick={confirmar}>
            {enviando ? "Reenviando…" : "Reenviar a revisión"}
          </button>
        </div>
      </div>
    </div>
  );
}
