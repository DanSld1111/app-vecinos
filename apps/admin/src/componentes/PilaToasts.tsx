import { useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import { Toast, useToasts } from "../estado/useToasts";

const ICONOS = {
  exito: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  error: (
    <>
      <path d="M12 7v6" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
};

/** Una alerta: entra con rebote, cuenta su tiempo (en pausa con el mouse encima) y sale hacia arriba. */
function Alerta({ toast, onCerrar }: { toast: Toast; onCerrar: (id: number) => void }) {
  const [saliendo, setSaliendo] = useState(false);
  const restante = useRef(toast.duracion);
  const inicio = useRef(Date.now());
  const temporizador = useRef<number | undefined>(undefined);
  const seCierraSola = toast.tipo !== "error";

  function cerrar() {
    if (saliendo) return;
    window.clearTimeout(temporizador.current);
    setSaliendo(true);
    window.setTimeout(() => onCerrar(toast.id), 280);
  }
  function arrancar(ms: number) {
    inicio.current = Date.now();
    temporizador.current = window.setTimeout(cerrar, ms);
  }

  useEffect(() => {
    if (seCierraSola) arrancar(restante.current);
    return () => window.clearTimeout(temporizador.current);
    // Solo al montar: el tiempo se maneja con pausar/seguir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`alerta-panel ${toast.tipo} ${saliendo ? "saliendo" : ""}`}
      role={toast.tipo === "error" ? "alert" : "status"}
      onMouseEnter={() => {
        if (!seCierraSola) return;
        window.clearTimeout(temporizador.current);
        restante.current -= Date.now() - inicio.current;
      }}
      onMouseLeave={() => seCierraSola && arrancar(Math.max(restante.current, 600))}
    >
      <div className="alerta-icono" aria-hidden="true">
        <svg viewBox="0 0 24 24">{ICONOS[toast.tipo]}</svg>
      </div>
      <div className="alerta-texto">
        <div className="alerta-titulo">{toast.titulo}</div>
        {toast.detalle ? <div className="alerta-detalle">{toast.detalle}</div> : null}
        {toast.reintentar ? (
          <button
            type="button"
            className="alerta-reintentar"
            onClick={() => {
              cerrar();
              toast.reintentar?.();
            }}
          >
            Reintentar
          </button>
        ) : null}
      </div>
      <button type="button" className="alerta-cerrar" aria-label="Cerrar aviso" onClick={cerrar}>
        <LuX />
      </button>
      {seCierraSola ? <div className="alerta-tiempo" style={{ animationDuration: `${toast.duracion}ms` }} /> : null}
    </div>
  );
}

/** Se monta una sola vez (LayoutAdmin): las alertas flotan arriba al centro, sobre todo lo demás. */
export function PilaToasts() {
  const toasts = useToasts((estado) => estado.toasts);
  const cerrar = useToasts((estado) => estado.cerrar);
  return (
    <div className="pila-alertas" aria-live="polite">
      {toasts.map((toast) => (
        <Alerta key={toast.id} toast={toast} onCerrar={cerrar} />
      ))}
    </div>
  );
}
