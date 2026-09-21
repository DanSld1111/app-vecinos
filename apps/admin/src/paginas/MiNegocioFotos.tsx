import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { EditorFotosNegocio } from "../componentes/negocio/EditorFotosNegocio";

export function MiNegocioFotos() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Fotos</h2>
          <p>{activo.nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      <EditorFotosNegocio key={activo.id} negocio={activo} />
    </>
  );
}
