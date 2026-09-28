import { useEffect, useMemo, useState } from "react";
import { FICHAS, TIPOS_FICHA, TipoFicha } from "@app-vecinos/tipos";
import { useCategorias } from "../estado/useCategorias";
import { useServiciosApp } from "../estado/useServiciosApp";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { TarjetaFicha } from "../componentes/fichas/TarjetaFicha";
import { TelefonoFicha } from "../componentes/fichas/TelefonoFicha";
import { useNegocioEjemplo } from "../componentes/fichas/useNegocioEjemplo";

/**
 * Catálogo de las fichas que la app sabe mostrar y dónde se usa cada una. Aquí no se configura
 * nada: la ficha se elige en Servicios (por defecto) y en Categorías (para cambiarla). Reemplaza a
 * Plantillas y Arquetipos — ver docs/decisiones/0080-fichas.md.
 */
export function Fichas() {
  const categorias = useCategorias((e) => e.categorias);
  const cargarCategorias = useCategorias((e) => e.cargar);
  const servicios = useServiciosApp((e) => e.servicios);
  const cargarServicios = useServiciosApp((e) => e.cargar);
  const token = useSesionAdmin((e) => e.token);
  const [elegida, setElegida] = useState<TipoFicha>("menu");

  useEffect(() => {
    cargarCategorias();
    cargarServicios();
  }, [cargarCategorias, cargarServicios]);

  const usos = useMemo(() => {
    const porFicha = {} as Record<TipoFicha, { servicios: string[]; categorias: { id: string; nombre: string }[] }>;
    for (const f of TIPOS_FICHA) porFicha[f] = { servicios: [], categorias: [] };
    for (const s of servicios) if (s.ficha) porFicha[s.ficha].servicios.push(s.nombre);
    for (const c of categorias) porFicha[c.fichaEfectiva ?? "galeria"].categorias.push({ id: c.id, nombre: c.nombre });
    return porFicha;
  }, [servicios, categorias]);

  const uso = usos[elegida];
  const ejemplo = useNegocioEjemplo(uso.categorias.map((c) => c.id), elegida, token);
  const categoriaEjemplo = categorias.find((c) => ejemplo.negocio?.categoriaIds.includes(c.id));
  const info = FICHAS[elegida];

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Fichas</h2>
          <p>
            Los diseños de ficha que la app sabe mostrar y dónde se usa cada uno. La ficha se elige en Servicios y
            en Categorías.
          </p>
        </div>
      </div>

      <div className="con-telefono">
        <div className="con-telefono-principal">
          <div className="grid-fichas">
            {TIPOS_FICHA.map((f) => {
              const u = usos[f];
              return (
                <TarjetaFicha
                  key={f}
                  ficha={f}
                  seleccionada={f === elegida}
                  onElegir={() => setElegida(f)}
                  uso={`${u.categorias.length} ${u.categorias.length === 1 ? "categoría" : "categorías"} · ${u.servicios.length} ${u.servicios.length === 1 ? "servicio" : "servicios"}`}
                />
              );
            })}
            <div className="ficha-nueva">
              <b>¿Falta un diseño?</b>
              Por ejemplo, reservas por hora. Una ficha nueva se programa una vez en la app y después aparece aquí
              para cualquier servicio o categoría.
            </div>
          </div>

          <div className="panel detalle-ficha">
            <div>
              <h4>Qué carga el dueño del negocio</h4>
              <ul>
                {info.queCarga.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Dónde se usa</h4>
              <div className="pills-uso">
                {uso.servicios.map((s) => (
                  <span key={s} className="pill pill-verde">
                    Servicio: {s}
                  </span>
                ))}
                {uso.categorias.map((c) => (
                  <span key={c.id} className="pill pill-gris">
                    {c.nombre}
                  </span>
                ))}
                {uso.servicios.length + uso.categorias.length === 0 ? (
                  <span className="pill pill-gris">Todavía no la usa nadie</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="columna-telefono">
          <p className="rotulo-telefono">
            Ficha <b>{info.nombre}</b>
            {ejemplo.negocio ? " con un negocio real" : " con contenido de ejemplo"}
          </p>
          <TelefonoFicha
            ficha={elegida}
            titulo={info.tituloPorDefecto}
            campos={categoriaEjemplo?.atributosProducto ?? []}
            rotulo={categoriaEjemplo?.nombre ?? "Categoría"}
            negocio={ejemplo.negocio}
            productos={ejemplo.productos}
            cargando={ejemplo.cargando}
          />
          <p className="leyenda-telefono">Toca otra ficha para ver cómo cambia.</p>
        </aside>
      </div>
    </>
  );
}
