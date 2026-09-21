import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { EditorHorarioNegocio } from "../componentes/negocio/EditorHorarioNegocio";

export function MiNegocioHorario() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Horario</h2>
          <p>{activo.nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      <EditorHorarioNegocio key={activo.id} negocio={activo} />
    </>
  );
}
