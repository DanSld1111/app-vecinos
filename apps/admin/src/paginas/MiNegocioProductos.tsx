import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { ConVistaPrevia } from "../componentes/negocio/ConVistaPrevia";
import { EditorProductosNegocio } from "../componentes/negocio/EditorProductosNegocio";

export function MiNegocioProductos() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Productos</h2>
          <p>{activo.nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      <ConVistaPrevia negocio={activo}>
        <EditorProductosNegocio key={activo.id} negocio={activo} />
      </ConVistaPrevia>
    </>
  );
}
