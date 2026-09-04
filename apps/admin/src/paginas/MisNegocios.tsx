import { Navigate, useNavigate } from "react-router-dom";
import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { useCategorias } from "../estado/useCategorias";
import { IconoCategoria } from "../componentes/IconoCategoria";
import { estadoVisualDe, ETIQUETA_ESTADO_VISUAL, ICONO_ESTADO_VISUAL } from "../utilidades/estadoNegocio";

export function MisNegocios() {
  const { misNegocios, elegir } = useNegociosDelDueno();
  const categorias = useCategorias((estado) => estado.categorias);
  const navigate = useNavigate();

  if (misNegocios.length <= 1) return <Navigate to="/mi-negocio" replace />;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Mis negocios</h2>
          <p>
            Tienes {misNegocios.length} negocios registrados en ELISUR — elige cuál quieres gestionar
          </p>
        </div>
      </div>

      <div className="nota-info">
        ℹ️ Cada negocio tiene su propia información, horario, fotos, ofertas y estado — nada se mezcla entre
        ellos.
      </div>

      <div className="grid-mis-negocios">
        {misNegocios.map((negocio) => {
          const categoria = categorias.find((c) => negocio.categoriaIds.includes(c.id));
          const estadoVisual = estadoVisualDe(negocio);
          return (
            <button
              key={negocio.id}
              type="button"
              className="tarjeta-mi-negocio"
              onClick={() => {
                elegir(negocio.id);
                navigate("/mi-negocio");
              }}
            >
              <div className="cabecera-mi-negocio">
                <div className="icono-mi-negocio">
                  <IconoCategoria nombre={categoria?.icono ?? "storefront-outline"} size={20} />
                </div>
                <div>
                  <b>{negocio.nombre}</b>
                  <span>{categoria?.nombre ?? "Sin categoría"}</span>
                </div>
              </div>
              <span className={`badge-estado-mini ${estadoVisual}`}>
                {ICONO_ESTADO_VISUAL[estadoVisual]} {ETIQUETA_ESTADO_VISUAL[estadoVisual]}
              </span>
              <p className="meta-mi-negocio">
                {estadoVisual === "rechazado"
                  ? "Corrige lo indicado en Estado y vuelve a enviarlo"
                  : estadoVisual === "pendiente"
                  ? "En revisión por el equipo ELISUR"
                  : `Visible para vecinos de San Borja`}
              </p>
              <span className="btn-gestionar-negocio">Gestionar este negocio →</span>
            </button>
          );
        })}

        <div className="tarjeta-mi-negocio tarjeta-agregar-negocio">
          <span style={{ fontSize: 24 }}>➕</span>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>Agregar otro negocio</p>
          <p style={{ margin: 0, fontSize: 10.5, fontWeight: 500 }}>Escríbenos para sumarlo a tu cuenta</p>
        </div>
      </div>
    </>
  );
}
