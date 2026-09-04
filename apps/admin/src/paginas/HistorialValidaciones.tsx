import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNegocios } from "../estado/useNegocios";
import { useAvisos } from "../estado/useAvisos";
import { useSesionAdmin } from "../estado/useSesionAdmin";

interface FilaHistorial {
  id: string;
  tipo: "negocio" | "aviso";
  titulo: string;
  aprobado: boolean;
  motivo: string | null;
  fecha: string;
}

type FiltroTipo = "todos" | "negocio" | "aviso";
type FiltroResultado = "todos" | "aprobado" | "rechazado";

export function HistorialValidaciones() {
  const token = useSesionAdmin((estado) => estado.token)!;
  const negocios = useNegocios((estado) => estado.negocios);
  const cargandoNegocios = useNegocios((estado) => estado.cargando);
  const errorNegocios = useNegocios((estado) => estado.error);
  const cargarHistorialNegocios = useNegocios((estado) => estado.cargarHistorial);
  const avisos = useAvisos((estado) => estado.avisos);
  const cargandoAvisos = useAvisos((estado) => estado.cargando);
  const errorAvisos = useAvisos((estado) => estado.error);
  const cargarHistorialAvisos = useAvisos((estado) => estado.cargarHistorial);

  useEffect(() => {
    cargarHistorialNegocios(token);
    cargarHistorialAvisos(token);
  }, [cargarHistorialNegocios, cargarHistorialAvisos, token]);

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroResultado, setFiltroResultado] = useState<FiltroResultado>("todos");

  const filas: FilaHistorial[] = useMemo(() => {
    // negocios y avisos ya vienen filtrados por el servidor a "resuelto" + alcance de esta
    // cuenta (GET /negocios/historial y GET /avisos/historial) — no hace falta repetirlo acá.
    const deNegocios: FilaHistorial[] = negocios.map((n) => ({
      id: n.id,
      tipo: "negocio",
      titulo: n.nombre,
      aprobado: n.motivoRechazo === null,
      motivo: n.motivoRechazo,
      fecha: n.actualizadoEn,
    }));

    const deAvisos: FilaHistorial[] = avisos.map((a) => ({
      id: a.id,
      tipo: "aviso",
      titulo: a.titulo,
      aprobado: a.estado === "publicado",
      motivo: a.motivoRechazo,
      fecha: a.publicadoEn,
    }));

    return [...deNegocios, ...deAvisos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [negocios, avisos]);

  const resumen = useMemo(
    () => ({
      total: filas.length,
      aprobadas: filas.filter((f) => f.aprobado).length,
      rechazadas: filas.filter((f) => !f.aprobado).length,
    }),
    [filas]
  );

  const tasaAprobacion = resumen.total ? Math.round((resumen.aprobadas / resumen.total) * 100) : 0;

  const filasFiltradas = filas.filter((f) => {
    const coincideTipo = filtroTipo === "todos" || f.tipo === filtroTipo;
    const coincideResultado =
      filtroResultado === "todos" || (filtroResultado === "aprobado" ? f.aprobado : !f.aprobado);
    return coincideTipo && coincideResultado;
  });

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Historial de validaciones</h2>
          <p>{filas.length} validaciones registradas</p>
        </div>
        <Link className="link-historial" to="/validacion">
          ← Volver a la cola
        </Link>
      </div>

      {errorNegocios || errorAvisos ? (
        <div className="nota-alerta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {errorNegocios ?? errorAvisos}</span>
          <button
            className="btn-accion-mini"
            onClick={() => {
              cargarHistorialNegocios(token);
              cargarHistorialAvisos(token);
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {(cargandoNegocios || cargandoAvisos) && negocios.length === 0 && avisos.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Cargando historial…
        </div>
      ) : (
      <>
      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>📋</div>
          <div>
            <b>{resumen.total}</b>
            <span>Total revisadas</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>✅</div>
          <div>
            <b>{resumen.aprobadas}</b>
            <span>Aprobadas</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--rojo-suave)" }}>✕</div>
          <div>
            <b>{resumen.rechazadas}</b>
            <span>Rechazadas</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>📊</div>
          <div>
            <b>{tasaAprobacion}%</b>
            <span>Tasa de aprobación</span>
          </div>
        </div>
      </div>

      <div className="fila-filtro" style={{ marginBottom: 16 }}>
        <button className={`chip-filtro ${filtroTipo === "todos" ? "activo" : ""}`} onClick={() => setFiltroTipo("todos")}>
          Todos
        </button>
        <button className={`chip-filtro ${filtroTipo === "negocio" ? "activo" : ""}`} onClick={() => setFiltroTipo("negocio")}>
          🏪 Negocios
        </button>
        <button className={`chip-filtro ${filtroTipo === "aviso" ? "activo" : ""}`} onClick={() => setFiltroTipo("aviso")}>
          📢 Avisos
        </button>
        <button
          className={`chip-filtro ${filtroResultado === "aprobado" ? "activo" : ""}`}
          onClick={() => setFiltroResultado(filtroResultado === "aprobado" ? "todos" : "aprobado")}
        >
          ✅ Aprobados
        </button>
        <button
          className={`chip-filtro ${filtroResultado === "rechazado" ? "activo" : ""}`}
          onClick={() => setFiltroResultado(filtroResultado === "rechazado" ? "todos" : "rechazado")}
        >
          ✕ Rechazados
        </button>
      </div>

      <div className="lista-historial">
        {filasFiltradas.map((fila) => (
          <div className="fila-historial" key={`${fila.tipo}-${fila.id}`}>
            <div className={`icono-item-cola ${fila.tipo}`}>{fila.tipo === "negocio" ? "🏪" : "📢"}</div>
            <div className="info-historial">
              <b>{fila.titulo}</b>
              {fila.aprobado ? null : (
                <span className="motivo-hist">
                  <b className="motivo-hist-etiqueta">Motivo del rechazo:</b> {fila.motivo}
                </span>
              )}
            </div>
            <span className="tipo-hist-pill">{fila.tipo === "negocio" ? "🏪 Negocio" : "📢 Aviso"}</span>
            <span className={`resultado-pill ${fila.aprobado ? "aprobado" : "rechazado"}`}>
              {fila.aprobado ? "Aprobado" : "Rechazado"}
            </span>
            <span className="fecha-hist">{new Date(fila.fecha).toLocaleString("es-PE")}</span>
          </div>
        ))}
        {filasFiltradas.length === 0 ? (
          <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
            {filas.length === 0 ? "Todavía no hay validaciones registradas." : "Nada coincide con este filtro."}
          </div>
        ) : null}
      </div>
      </>
      )}
    </>
  );
}
