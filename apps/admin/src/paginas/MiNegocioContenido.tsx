import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { EditorServiciosNegocio } from "../componentes/negocio/EditorServiciosNegocio";
import { EditorListaNegocio } from "../componentes/negocio/EditorListaNegocio";

/** Servicios y tarifas, Rubros y Pasillos del dueño — los mismos editores que usa el admin. */
function PaginaContenido({ titulo, children }: { titulo: string; children: (negocio: NonNullable<ReturnType<typeof useNegociosDelDueno>["activo"]>) => React.ReactNode }) {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;
  return (
    <>
      <div className="topbar">
        <div>
          <h2>{titulo}</h2>
          <p>{activo.nombre} · San Borja</p>
        </div>
      </div>
      <TabsMiNegocio />
      {children(activo)}
    </>
  );
}

export function MiNegocioServicios() {
  return <PaginaContenido titulo="Servicios y tarifas">{(n) => <EditorServiciosNegocio key={n.id} negocio={n} />}</PaginaContenido>;
}

export function MiNegocioRubros() {
  return <PaginaContenido titulo="Rubros">{(n) => <EditorListaNegocio key={n.id} negocio={n} lista="rubros" />}</PaginaContenido>;
}

export function MiNegocioPasillos() {
  return <PaginaContenido titulo="Pasillos">{(n) => <EditorListaNegocio key={n.id} negocio={n} lista="pasillos" />}</PaginaContenido>;
}
