import { ReactNode } from "react";
import { Negocio } from "@app-vecinos/tipos";
import { estadoVisualDe } from "../../utilidades/estadoNegocio";

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Estado de publicación y su línea de tiempo. El dueño solo lo consulta; el admin recibe además
 * los botones de publicar/despublicar por `acciones` (él es quien decide).
 *
 * Editar ya no manda a revisión (ver decisión 0066): esta pantalla describe el alta inicial —
 * un negocio nace "por verificar" y se publica una vez.
 */
export function EditorEstadoNegocio({ negocio, acciones }: { negocio: Negocio; acciones?: ReactNode }) {
  const estadoVisual = estadoVisualDe(negocio);

  return (
    <>
      {estadoVisual === "rechazado" ? (
        <div className="tarjeta-estado-grande rechazado">
          <div className="icono-estado-grande">✕</div>
          <div>
            <h3>El último envío fue rechazado</h3>
            <p>Corrige lo que se indica abajo y vuelve a enviarlo desde "Información".</p>
          </div>
        </div>
      ) : estadoVisual === "activo" ? (
        <div className="tarjeta-estado-grande activo">
          <div className="icono-estado-grande">✅</div>
          <div>
            <h3>Publicado y visible en la app</h3>
            <p>
              Los vecinos de San Borja lo ven en Buscar y en su ficha
              {negocio.verificadoEn ? ` desde el ${formatearFecha(negocio.verificadoEn)}` : ""}.
            </p>
          </div>
        </div>
      ) : (
        <div className="tarjeta-estado-grande pendiente">
          <div className="icono-estado-grande">⏳</div>
          <div>
            <h3>Todavía sin publicar</h3>
            <p>
              La ficha no se ve en la app hasta publicarla. Aprovecha para completar foto, horario y productos
              antes.
            </p>
          </div>
        </div>
      )}

      {acciones ? (
        <div className="tarjeta" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {acciones}
        </div>
      ) : null}

      <div className="tarjeta">
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            textTransform: "uppercase",
            color: "var(--texto-tenue)",
            marginBottom: 14,
          }}
        >
          Línea de tiempo
        </div>
        <div className="linea-tiempo-estado">
          <div className="paso-tiempo">
            <div className="punto-tiempo hecho">✓</div>
            <div className="cuerpo-paso">
              <b>Ficha creada</b>
              <span>{formatearFecha(negocio.creadoEn)}</span>
            </div>
          </div>

          {estadoVisual === "rechazado" ? (
            <div className="paso-tiempo">
              <div className="punto-tiempo malo">✕</div>
              <div className="cuerpo-paso">
                <b>Rechazado por el equipo ELISUR</b>
                <span>{formatearFecha(negocio.actualizadoEn)}</span>
                <div className="caja-motivo-rechazo">"{negocio.motivoRechazo}"</div>
              </div>
            </div>
          ) : estadoVisual === "activo" ? (
            <>
              <div className="paso-tiempo">
                <div className="punto-tiempo hecho">✓</div>
                <div className="cuerpo-paso">
                  <b>Publicado</b>
                  <span>{formatearFecha(negocio.verificadoEn)}</span>
                </div>
              </div>
              <div className="paso-tiempo">
                <div className="punto-tiempo hecho">👁️</div>
                <div className="cuerpo-paso">
                  <b>Visible para los vecinos</b>
                  <span>Desde entonces</span>
                </div>
              </div>
            </>
          ) : (
            <div className="paso-tiempo">
              <div className="punto-tiempo actual">⏳</div>
              <div className="cuerpo-paso">
                <b>Sin publicar</b>
                <span>Se publica desde esta pantalla</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
