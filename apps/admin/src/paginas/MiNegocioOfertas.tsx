import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { EditorOfertasNegocio } from "../componentes/negocio/EditorOfertasNegocio";

export function MiNegocioOfertas() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Ofertas</h2>
          <p>{activo.nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      <EditorOfertasNegocio key={activo.id} negocio={activo} />
    </>
  );
}
