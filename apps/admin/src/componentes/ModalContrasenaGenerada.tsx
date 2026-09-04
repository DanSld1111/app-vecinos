import { useState } from "react";

export function ModalContrasenaGenerada({
  titulo,
  nombre,
  correo,
  contrasena,
  onCerrar,
}: {
  titulo: string;
  nombre: string;
  correo: string;
  contrasena: string;
  onCerrar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(contrasena);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Si el portapapeles no está disponible, la contraseña sigue visible para copiarla a mano.
    }
  }

  return (
    <div className="overlay-modal" onClick={onCerrar}>
      <div className="modal-card" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div className="icono-exito">🔑</div>
        <h3>{titulo}</h3>
        <p className="sub">
          Copia esta contraseña temporal y compártesela a la persona por un canal seguro (WhatsApp, en
          persona, etc.).
        </p>

        <div className="fila-cuenta-generada">
          <div className="avatar-mini">👤</div>
          <div>
            <b>{nombre}</b>
            <span>{correo}</span>
          </div>
        </div>

        <div className="caja-password">
          <span className="clave">{contrasena}</span>
          <button className="btn-copiar" onClick={copiar} type="button">
            {copiado ? "✓ Copiado" : "📋 Copiar"}
          </button>
        </div>

        <div className="aviso-una-vez">
          ⚠️ Por seguridad, esta contraseña <b>no se vuelve a mostrar</b>. Si la pierdes, tendrás que
          generar una nueva desde "Restablecer clave".
        </div>

        <button className="btn-entendido" onClick={onCerrar} type="button">
          Ya la copié, cerrar
        </button>
      </div>
    </div>
  );
}
