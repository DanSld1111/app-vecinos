import { useToasts } from "../estado/useToasts";

/** Se monta una sola vez (LayoutAdmin) — flota sobre todo lo demás. */
export function PilaToasts() {
  const toasts = useToasts((estado) => estado.toasts);
  const cerrar = useToasts((estado) => estado.cerrar);

  if (toasts.length === 0) return null;

  return (
    <div className="pila-avisos">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`aviso-flotante ${toast.tipo === "error" ? "aviso-flotante--error" : ""}`}
          onClick={() => cerrar(toast.id)}
        >
          <span>{toast.tipo === "error" ? "⚠️" : "✅"}</span>
          {toast.mensaje}
        </div>
      ))}
    </div>
  );
}
