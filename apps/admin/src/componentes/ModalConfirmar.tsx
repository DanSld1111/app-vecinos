import { useState } from "react";

/** Confirmación genérica antes de una acción que no se deshace fácil (eliminar, enviar a
 * papelera, etc.) — mismo look que ModalConfirmarEliminar de Cuentas.tsx, reutilizable. */
export function ModalConfirmar({
  titulo,
  mensaje,
  textoConfirmar = "Sí, continuar",
  peligroso = true,
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  peligroso?: boolean;
  onConfirmar: () => void | Promise<void>;
  onCancelar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);

  async function confirmar() {
    setConfirmando(true);
    await onConfirmar();
    setConfirmando(false);
  }

  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div className="icono-alerta">⚠️</div>
        <h3>{titulo}</h3>
        <p className="sub">{mensaje}</p>
        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCancelar} disabled={confirmando}>
            Cancelar
          </button>
          <button
            className={peligroso ? "btn-eliminar-confirmar" : "btn-crear"}
            onClick={confirmar}
            disabled={confirmando}
          >
            {confirmando ? "Un momento…" : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
