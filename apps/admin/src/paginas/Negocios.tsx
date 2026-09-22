import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EstadoNegocio } from "@app-vecinos/tipos";
import { useNegocios } from "../estado/useNegocios";
import { useGeografia } from "../estado/useGeografia";
import { useCuentas } from "../estado/useCuentas";
import { useCategorias } from "../estado/useCategorias";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { fichaCompleta, partesDeFicha, resumenDeLoQueFalta } from "../utilidades/completitudNegocio";
import { urlCompleta } from "../utilidades/media";

type FiltroEstado = "todos" | "activo" | "por_verificar" | "inactivo";

function pillEstado(estado: EstadoNegocio) {
  if (estado === "activo") return <span className="estado-negocio-pill activo">Activo</span>;
  if (estado === "por_verificar") return <span className="estado-negocio-pill verificar">Por verificar</span>;
  return <span className="estado-negocio-pill inactivo">Inactivo</span>;
}

export function Negocios() {
  const navegar = useNavigate();
  const negociosMock = useNegocios((estado) => estado.negocios);
  const cargandoNegocios = useNegocios((estado) => estado.cargando);
  const errorNegocios = useNegocios((estado) => estado.error);
  const cargarNegocios = useNegocios((estado) => estado.cargarAdmin);
  const cargarMasNegocios = useNegocios((estado) => estado.cargarMasAdmin);
  const cursorSiguienteNegocios = useNegocios((estado) => estado.cursorSiguiente);
  const cargandoMasNegocios = useNegocios((estado) => estado.cargandoMas);
  const comunidades = useGeografia((estado) => estado.comunidades);
  const token = useSesionAdmin((estado) => estado.token)!;
  const cargarCuentas = useCuentas((estado) => estado.cargar);
  const cuentas = useCuentas((estado) => estado.cuentas);
  const categorias = useCategorias((estado) => estado.categorias);

  const [verArchivados, setVerArchivados] = useState(false);

  useEffect(() => {
    cargarCuentas(token);
    cargarNegocios(token, verArchivados);
  }, [cargarCuentas, cargarNegocios, token, verArchivados]);

  const [searchParams, setSearchParams] = useSearchParams();
  const comunidadIdFiltro = searchParams.get("comunidadId");

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("todos");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [soloIncompletos, setSoloIncompletos] = useState(false);

  const categoriaPorId = useMemo(
    () => Object.fromEntries(categorias.map((c) => [c.id, c])),
    [categorias]
  );

  /** Qué negocios ya tienen un dueño vinculado — es una de las partes de la ficha. */
  const negociosConDueno = useMemo(
    () => new Set(cuentas.filter((c) => c.rol === "dueno_negocio").flatMap((c) => c.negocioIds)),
    [cuentas]
  );

  const comunidadFiltro = comunidadIdFiltro ? comunidades.find((c) => c.id === comunidadIdFiltro) ?? null : null;

  const negocios = negociosMock.filter((negocio) => {
    const coincideBusqueda = negocio.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = !categoriaId || negocio.categoriaIds.includes(categoriaId);
    const coincideComunidad = !comunidadIdFiltro || negocio.comunidadId === comunidadIdFiltro;
    const coincideEstado = estadoFiltro === "todos" || negocio.estado === estadoFiltro;
    const coincideCompletitud = !soloIncompletos || !fichaCompleta(negocio, negociosConDueno.has(negocio.id));
    return coincideBusqueda && coincideCategoria && coincideComunidad && coincideEstado && coincideCompletitud;
  });

  const resumen = useMemo(
    () => ({
      total: negociosMock.length,
      activos: negociosMock.filter((n) => n.estado === "activo").length,
      porVerificar: negociosMock.filter((n) => n.estado === "por_verificar").length,
      incompletas: negociosMock.filter((n) => !fichaCompleta(n, negociosConDueno.has(n.id))).length,
    }),
    [negociosMock, negociosConDueno]
  );

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Negocios</h2>
          <p>
            {resumen.total} negocios registrados · {negocios.length} mostrados
          </p>
        </div>
        <button className="btn btn-primario" onClick={() => navegar("/negocios/nuevo")}>
          ＋ Nuevo negocio
        </button>
      </div>

      {errorNegocios ? (
        <div className="nota-alerta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {errorNegocios}</span>
          <button className="btn-accion-mini" onClick={() => cargarNegocios(token)}>
            Reintentar
          </button>
        </div>
      ) : null}

      {cargandoNegocios && negociosMock.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Cargando negocios…
        </div>
      ) : (
      <>
      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>🏪</div>
          <div>
            <b>{resumen.total}</b>
            <span>Total negocios</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>✅</div>
          <div>
            <b>{resumen.activos}</b>
            <span>Activos</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--oro-suave)" }}>⏳</div>
          <div>
            <b>{resumen.porVerificar}</b>
            <span>Por verificar</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>📝</div>
          <div>
            <b>{resumen.incompletas}</b>
            <span>Fichas incompletas</span>
          </div>
        </div>
      </div>

      {comunidadFiltro ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12.5 }}>
          <span className="pill pill-azul">📍 {comunidadFiltro.nombre}</span>
          <button className="btn btn-fantasma" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setSearchParams({})}>
            Quitar filtro ✕
          </button>
        </div>
      ) : null}

      <div className="barra-filtros">
        <div className="buscador-mini">
          🔍
          <input placeholder="Buscar negocio…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="fila-filtro">
          {/* Un desplegable en vez de chips: con 14 categorías (y creciendo) una fila de
              botones se amontona — el select escala igual con 14 que con 40. */}
          <select
            className="select-filtro"
            value={categoriaId ?? ""}
            onChange={(e) => setCategoriaId(e.target.value || null)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <div className="segmentado">
            <button className={estadoFiltro === "todos" ? "activo" : ""} onClick={() => setEstadoFiltro("todos")}>
              Todos
            </button>
            <button className={estadoFiltro === "activo" ? "activo" : ""} onClick={() => setEstadoFiltro("activo")}>
              Activos
            </button>
            <button
              className={estadoFiltro === "por_verificar" ? "activo" : ""}
              onClick={() => setEstadoFiltro("por_verificar")}
            >
              Por verificar
            </button>
            <button className={estadoFiltro === "inactivo" ? "activo" : ""} onClick={() => setEstadoFiltro("inactivo")}>
              Inactivos
            </button>
          </div>

          <button
            className={`link-archivados ${verArchivados ? "activo" : ""}`}
            onClick={() => setVerArchivados((v) => !v)}
            title="Negocios archivados — no aparecen en la app ni en el listado normal"
          >
            📦 Ver archivados
          </button>

          <button
            className={`pill-pendiente ${soloIncompletos ? "activo" : ""}`}
            onClick={() => setSoloIncompletos((v) => !v)}
            title="Negocios a los que les falta foto, horario, descripción, categoría o dueño"
          >
            ⚠️ Con algo pendiente
          </button>
        </div>
      </div>

      <div className="grid-negocios">
        {negocios.map((negocio) => {
          const partes = partesDeFicha(negocio, negociosConDueno.has(negocio.id));
          const completadas = partes.filter((p) => p.completa).length;
          const falta = resumenDeLoQueFalta(negocio, negociosConDueno.has(negocio.id));
          return (
            <div className="tarjeta-negocio" key={negocio.id} onClick={() => navegar(`/negocios/${negocio.id}`)}>
              <div className="foto-tarjeta">
                {negocio.fotoPrincipalUrl ? <img src={urlCompleta(negocio.fotoPrincipalUrl)} alt="" /> : "🖼️"}
                <span className="estado-flotante">{pillEstado(negocio.estado)}</span>
              </div>
              <div className="cuerpo-tarjeta">
                <b>
                  {negocio.nombre} {negocio.verificadoEn ? <span className="check-verificado">✓</span> : null}
                </b>
                <span className="direccion-tarjeta">{negocio.direccion}</span>
                <div className="cats-negocio">
                  {negocio.categoriaIds.slice(0, 2).map((id) => (
                    <span className="cat-tag" key={id}>
                      {categoriaPorId[id]?.nombre ?? id}
                    </span>
                  ))}
                </div>
                <div className="progreso-tarjeta" title={falta ?? "Ficha completa"}>
                  <div className="barra-progreso">
                    <i style={{ width: `${(completadas / partes.length) * 100}%` }} />
                  </div>
                  <span className="frac-progreso">{completadas === partes.length ? "Completa" : `${completadas}/${partes.length}`}</span>
                </div>
              </div>
            </div>
          );
        })}
        {negocios.length === 0 ? (
          <div
            className="panel"
            style={{ gridColumn: "1 / -1", padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}
          >
            {verArchivados ? "No hay negocios archivados." : "No hay negocios que coincidan con el filtro."}
          </div>
        ) : null}
      </div>
      {cursorSiguienteNegocios ? (
        <button
          className="btn-accion-mini"
          style={{ display: "block", margin: "16px auto 0" }}
          disabled={cargandoMasNegocios}
          onClick={() => cargarMasNegocios(token, verArchivados)}
        >
          {cargandoMasNegocios ? "Cargando…" : "Cargar más negocios"}
        </button>
      ) : null}
      </>
      )}
    </>
  );
}
