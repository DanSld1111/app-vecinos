import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { EditorInfoNegocio } from "../componentes/negocio/EditorInfoNegocio";

/**
 * "Mi negocio" del dueño: encabezado y pestañas propias, pero el formulario es el mismo
 * componente que usa la ficha del panel (`/negocios/:id`) — una sola implementación para los
 * dos contextos.
 */
export function MiNegocio() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Mi negocio</h2>
          <p>{activo.nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      <EditorInfoNegocio key={activo.id} negocio={activo} />
    </>
  );
}
