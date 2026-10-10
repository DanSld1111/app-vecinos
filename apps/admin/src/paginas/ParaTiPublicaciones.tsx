import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuPencil, LuPlus, LuSearch, LuTrash2 } from "react-icons/lu";
import { Publicacion } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { avisarErrorParaTi, useParaTi } from "../estado/useParaTi";
import { alertaExito } from "../estado/useToasts";
import { estadoDe, estaDestacada } from "../utilidades/paraTi";
import { TarjetaMuro } from "./ParaTiInicio";

type Filtro = "todas" | "publicadas" | "programadas" | "destacadas" | "borradores";

const FILTROS: { id: Filtro; texto: string; cumple: (p: Publicacion) => boolean }[] = [
  { id: "todas", texto: "Todas", cumple: () => true },
  { id: "publicadas", texto: "Publicadas", cumple: (p) => estadoDe(p) === "publicada" },
  { id: "programadas", texto: "Programadas", cumple: (p) => estadoDe(p) === "programada" },
  { id: "destacadas", texto: "Destacadas", cumple: estaDestacada },
  { id: "borradores", texto: "Borradores", cumple: (p) => p.estado === "borrador" },
];

/** Todas las publicaciones de Para ti en cuadrícula, con filtros, buscador y acciones (0092). */
export function ParaTiPublicaciones() {
  const token = useSesionAdmin((e) => e.token)!;
  const navegar = useNavigate();
  const { publicaciones, cargar, cargando, eliminar } = useParaTi();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);

  useEffect(() => {
    cargar(token);
  }, [token, cargar]);

  const cuentas = useMemo(() => Object.fromEntries(FILTROS.map((f) => [f.id, publicaciones.filter(f.cumple).length])) as Record<Filtro, number>, [publicaciones]);
  const q = busqueda.trim().toLowerCase();
  const lista = publicaciones.filter(
    (p) => FILTROS.find((f) => f.id === filtro)!.cumple(p) && (!q || `${p.texto} ${p.enlaceTitulo ?? ""}`.toLowerCase().includes(q)),
  );

  async function borrar(p: Publicacion) {
    if (await eliminar(p.id, token)) alertaExito("Publicación eliminada", p.texto.slice(0, 60) || undefined);
    else avisarErrorParaTi("No se pudo eliminar");
    setConfirmando(null);
  }

  return (
    <div className="para-ti-admin">
      <div className="cabecera-para-ti">
        <div>
          <h2>Publicaciones</h2>
          <span className="fecha-para-ti">Se ven en todos los distritos. El autor que ven los vecinos es «ELISUR».</span>
        </div>
        <button className="btn-pildora primario" onClick={() => navegar("/para-ti/nueva")}>
          <LuPlus aria-hidden /> Crear publicación
        </button>
      </div>

      <div className="barra-filtros-para-ti">
        <div className="filtros-para-ti" role="tablist" aria-label="Filtrar publicaciones">
          {FILTROS.map((f) => (
            <button key={f.id} type="button" role="tab" aria-selected={filtro === f.id} className={filtro === f.id ? "activo" : ""} onClick={() => setFiltro(f.id)}>
              {f.texto} <span>{cuentas[f.id]}</span>
            </button>
          ))}
        </div>
        <label className="buscador-para-ti">
          <LuSearch aria-hidden />
          <span className="solo-lector">Buscar publicaciones</span>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por texto…" />
        </label>
      </div>

      {cargando && publicaciones.length === 0 ? <p className="vacio-editor">Cargando…</p> : null}
      {!cargando && lista.length === 0 ? (
        <div className="tarjeta vacio-para-ti">
          <b>{publicaciones.length === 0 ? "Todavía no hay publicaciones." : "Nada en este filtro."}</b>
        </div>
      ) : null}

      <div className="cuadricula-para-ti">
        {lista.map((p) => (
          <TarjetaMuro
            key={p.id}
            p={p}
            acciones={
              <div className="acciones-muro">
                {confirmando === p.id ? (
                  <>
                    <span className="confirmar-texto">¿Eliminar para siempre?</span>
                    <button className="btn-accion-mini peligro" onClick={() => borrar(p)}>
                      Sí, eliminar
                    </button>
                    <button className="btn-accion-mini" onClick={() => setConfirmando(null)}>
                      No
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-accion-mini" onClick={() => navegar(`/para-ti/${p.id}`)}>
                      <LuPencil aria-hidden /> Editar
                    </button>
                    <button className="btn-accion-mini" aria-label="Eliminar publicación" onClick={() => setConfirmando(p.id)}>
                      <LuTrash2 aria-hidden />
                    </button>
                  </>
                )}
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
