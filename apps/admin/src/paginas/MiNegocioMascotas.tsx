import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { EditorAlbergue } from "../componentes/albergue/EditorAlbergue";

/** El albergue de Rescate animal administra sus mascotas, solicitudes y padrinos (decisión 0097). */
export function MiNegocioMascotas() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Mascotas y adopciones</h2>
          <p>{activo.nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      <EditorAlbergue key={activo.id} negocio={activo} />
    </>
  );
}
