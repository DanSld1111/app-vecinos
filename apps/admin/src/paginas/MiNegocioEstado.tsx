import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { EditorEstadoNegocio } from "../componentes/negocio/EditorEstadoNegocio";

export function MiNegocioEstado() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Estado de mi negocio</h2>
          <p>{activo.nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      {/* Sin `acciones`: publicar o despublicar lo decide el equipo ELISUR desde el panel. */}
      <EditorEstadoNegocio negocio={activo} />
    </>
  );
}
