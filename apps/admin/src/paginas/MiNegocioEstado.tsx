import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { estadoVisualDe } from "../utilidades/estadoNegocio";

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function MiNegocioEstado() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;
  const negocio = activo;
  const estadoVisual = estadoVisualDe(negocio);

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Estado de mi negocio</h2>
          <p>{negocio.nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      {estadoVisual === "rechazado" ? (
        <div className="tarjeta-estado-grande rechazado">
          <div className="icono-estado-grande">✕</div>
          <div>
            <h3>Tu último envío fue rechazado</h3>
            <p>Corrige lo que se indica abajo y vuelve a enviarlo desde "Mi negocio" — no hace falta escribirnos.</p>
          </div>
        </div>
      ) : estadoVisual === "activo" ? (
        <div className="tarjeta-estado-grande activo">
          <div className="icono-estado-grande">✅</div>
          <div>
            <h3>Tu negocio está activo y visible</h3>
            <p>
              Los vecinos de San Borja pueden verte en Buscar y en la ficha
              {negocio.verificadoEn ? ` desde el ${negocio.verificadoEn}` : ""}.
            </p>
          </div>
        </div>
      ) : (
        <div className="tarjeta-estado-grande pendiente">
          <div className="icono-estado-grande">⏳</div>
          <div>
            <h3>Tu negocio está en revisión</h3>
            <p>
              El equipo ELISUR está validando tu información. Te avisaremos apenas quede aprobado o si hay
              algo que corregir.
            </p>
          </div>
        </div>
      )}

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
              <b>Enviado a validación</b>
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
                  <b>Aprobado por el equipo ELISUR</b>
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
                <b>En revisión</b>
                <span>El equipo ELISUR lo está evaluando</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
