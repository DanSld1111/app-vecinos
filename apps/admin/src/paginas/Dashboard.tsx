import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNegocios } from "../estado/useNegocios";
import { useAvisos } from "../estado/useAvisos";
import { useGeografia } from "../estado/useGeografia";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { distritoDeComunidad } from "../utilidades/alcance";

const HOY_CRUDO = new Date().toLocaleDateString("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const HOY = HOY_CRUDO.charAt(0).toUpperCase() + HOY_CRUDO.slice(1);

function tiempoRelativo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const horas = Math.max(1, Math.round(ms / 3_600_000));
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return `hace ${dias} día${dias === 1 ? "" : "s"}`;
}

interface ItemActividad {
  id: string;
  tipo: "negocio" | "aviso";
  titulo: string;
  detalle: string;
  distritoUbigeo: string;
  fecha: string;
  estado: "por_verificar" | "pendiente" | "activo" | "publicado";
}

export function Dashboard() {
  const token = useSesionAdmin((estado) => estado.token)!;
  const negocios = useNegocios((estado) => estado.negocios);
  const cargarNegocios = useNegocios((estado) => estado.cargarAdmin);
  const avisos = useAvisos((estado) => estado.avisos);
  const cargarAvisos = useAvisos((estado) => estado.cargarTodos);
  const distritos = useGeografia((estado) => estado.distritos);
  const comunidades = useGeografia((estado) => estado.comunidades);

  // El Dashboard necesita el panorama completo (todos los estados), no el recorte de
  // pendientes que carga el contador del sidebar — pide su propia copia completa.
  useEffect(() => {
    cargarNegocios(token);
    cargarAvisos(token);
  }, [cargarNegocios, cargarAvisos, token]);

  const [distritoSeleccionado, setDistritoSeleccionado] = useState<string>("todos");

  const negociosFiltrados = useMemo(
    () =>
      distritoSeleccionado === "todos"
        ? negocios
        : negocios.filter((n) => n.distritoUbigeo === distritoSeleccionado),
    [negocios, distritoSeleccionado]
  );
  const avisosFiltrados = useMemo(
    () =>
      distritoSeleccionado === "todos"
        ? avisos
        : avisos.filter((a) => distritoDeComunidad(comunidades, a.comunidadId) === distritoSeleccionado),
    [avisos, comunidades, distritoSeleccionado]
  );

  const negociosActivos = negociosFiltrados.filter((n) => n.estado === "activo").length;
  const negociosPendientes = negociosFiltrados.filter((n) => n.estado === "por_verificar").length;
  const avisosPendientes = avisosFiltrados.filter((a) => a.estado === "pendiente").length;

  const distritoActual = distritos.find((d) => d.ubigeo === distritoSeleccionado);
  const vistaTodos = distritoSeleccionado === "todos";

  // Distritos ordenados por "por verificar" descendente — el que necesita más atención primero.
  const rankingDistritos = useMemo(() => {
    return distritos
      .map((distrito) => {
        const suyos = negocios.filter((n) => n.distritoUbigeo === distrito.ubigeo);
        const avisosSuyos = avisos.filter(
          (a) => distritoDeComunidad(comunidades, a.comunidadId) === distrito.ubigeo
        );
        return {
          distrito,
          activos: suyos.filter((n) => n.estado === "activo").length,
          pendientes: suyos.filter((n) => n.estado === "por_verificar").length,
          avisosPendientes: avisosSuyos.filter((a) => a.estado === "pendiente").length,
        };
      })
      .sort((a, b) => b.pendientes - a.pendientes);
  }, [distritos, negocios, avisos, comunidades]);

  const actividadReciente: ItemActividad[] = useMemo(() => {
    const deNegocios: ItemActividad[] = negociosFiltrados.map((n) => ({
      id: n.id,
      tipo: "negocio",
      titulo: n.nombre,
      detalle:
        n.estado === "por_verificar"
          ? n.verificadoEn
            ? "Edición enviada a validación"
            : "Alta nueva"
          : `Aprobado`,
      distritoUbigeo: n.distritoUbigeo,
      fecha: n.actualizadoEn,
      estado: n.estado === "por_verificar" ? "por_verificar" : "activo",
    }));
    const deAvisos: ItemActividad[] = avisosFiltrados.map((a) => ({
      id: a.id,
      tipo: "aviso",
      titulo: a.titulo,
      detalle: a.fuenteNombre,
      distritoUbigeo: distritoDeComunidad(comunidades, a.comunidadId),
      fecha: a.publicadoEn,
      estado: a.estado === "pendiente" ? "pendiente" : "publicado",
    }));
    return [...deNegocios, ...deAvisos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 4);
  }, [negociosFiltrados, avisosFiltrados, comunidades]);

  const nombreDistrito = (ubigeo: string) => distritos.find((d) => d.ubigeo === ubigeo)?.nombre ?? ubigeo;

  const totalPendientes = negociosPendientes + avisosPendientes;
  const pctNegocios = totalPendientes === 0 ? 50 : Math.round((negociosPendientes / totalPendientes) * 100);
  const pctAvisos = 100 - pctNegocios;

  return (
    <>
      <div className="saludo-fila">
        <div>
          <h2>Buenas tardes, equipo 👋</h2>
          <p>
            Esto es lo que pasa hoy en{" "}
            {vistaTodos
              ? distritos.length === 1
                ? `el distrito activo (${distritos[0].nombre})`
                : `los ${distritos.length} distritos activos`
              : distritoActual?.nombre}
            .
          </p>
        </div>
        <div className="fila-controles">
          <select
            className="selector-distrito"
            value={distritoSeleccionado}
            onChange={(e) => setDistritoSeleccionado(e.target.value)}
          >
            <option value="todos">🌎 Todos los distritos</option>
            {distritos.map((d) => (
              <option key={d.ubigeo} value={d.ubigeo}>
                📍 {d.nombre}
              </option>
            ))}
          </select>
          <div className="fecha-chip">{HOY}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="top-row">
            <div className="stat-icono verde">🏪</div>
            <div className="stat-tendencia positiva">Activos</div>
          </div>
          <div className="stat-valor">{negociosActivos}</div>
          <div className="stat-etiqueta">Negocios activos</div>
        </div>
        <div className="stat-card">
          <div className="top-row">
            <div className="stat-icono oro">⏳</div>
            <div className="stat-tendencia atencion">{negociosPendientes > 0 ? "Revisar" : "Al día"}</div>
          </div>
          <div className="stat-valor">{negociosPendientes}</div>
          <div className="stat-etiqueta">Por verificar</div>
        </div>
        <div className="stat-card">
          <div className="top-row">
            <div className="stat-icono coral">📢</div>
            <div className="stat-tendencia atencion">{avisosPendientes > 0 ? "Revisar" : "Al día"}</div>
          </div>
          <div className="stat-valor">{avisosPendientes}</div>
          <div className="stat-etiqueta">Avisos pendientes</div>
        </div>
        <div className="stat-card">
          <div className="top-row">
            <div className="stat-icono azul">{vistaTodos ? "🗺️" : "👥"}</div>
            <div className="stat-tendencia neutral">{vistaTodos ? "En expansión" : "Piloto"}</div>
          </div>
          <div className="stat-valor">{vistaTodos ? distritos.length : 1}</div>
          <div className="stat-etiqueta">{vistaTodos ? "Distritos activos" : "Comunidad activa"}</div>
        </div>
      </div>

      <div className="acciones-rapidas">
        <Link to="/negocios" className="accion-rapida">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>➕</div>
          <div>
            <b>Nuevo negocio</b>
            <span>Alta manual</span>
          </div>
        </Link>
        <Link to="/novedades" className="accion-rapida">
          <div className="icono" style={{ background: "var(--coral-suave)" }}>📣</div>
          <div>
            <b>Nueva novedad</b>
            <span>Avisar a los vecinos</span>
          </div>
        </Link>
        {vistaTodos ? (
          <Link to="/distritos" className="accion-rapida">
            <div className="icono" style={{ background: "var(--azul-suave)" }}>🗺️</div>
            <div>
              <b>Nuevo distrito</b>
              <span>Expandir cobertura</span>
            </div>
          </Link>
        ) : (
          <Link to="/publicidad" className="accion-rapida">
            <div className="icono" style={{ background: "var(--azul-suave)" }}>🖼️</div>
            <div>
              <b>Nuevo anuncio</b>
              <span>Publicidad de la app</span>
            </div>
          </Link>
        )}
      </div>

      {vistaTodos && distritos.length > 0 ? (
        <div className="panel panel-full">
          <div className="panel-head">
            <h3>Distritos que necesitan atención</h3>
            <Link to="/distritos" className="ver-todo">
              Ver todos →
            </Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Distrito</th>
                <th>Negocios activos</th>
                <th>Por verificar ▾</th>
                <th>Avisos pendientes</th>
              </tr>
            </thead>
            <tbody>
              {rankingDistritos.map(({ distrito, activos, pendientes, avisosPendientes: avisosD }) => (
                <tr key={distrito.ubigeo}>
                  <td>
                    <div className="celda-distrito">
                      <div className="bandera">📍</div>
                      <div>
                        <b>{distrito.nombre}</b>
                        <br />
                        <span>UBIGEO {distrito.ubigeo}</span>
                      </div>
                    </div>
                  </td>
                  <td className="valor-mini">{activos}</td>
                  <td className="valor-mini" style={{ color: pendientes > 0 ? "var(--oro)" : "var(--texto-tenue)" }}>
                    {pendientes}
                  </td>
                  <td className="valor-mini" style={{ color: avisosD > 0 ? "var(--coral-fuerte)" : "var(--texto-tenue)" }}>
                    {avisosD}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="cuerpo-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Actividad reciente</h3>
            <Link to="/negocios" className="ver-todo">
              Ver todo →
            </Link>
          </div>
          {actividadReciente.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--texto-tenue)", fontSize: 12.5 }}>
              Sin actividad todavía.
            </div>
          ) : (
            actividadReciente.map((item) => (
              <div className="item-actividad" key={`${item.tipo}-${item.id}`}>
                <div
                  className="icono"
                  style={{
                    background:
                      item.estado === "por_verificar" || item.estado === "pendiente"
                        ? "var(--oro-suave)"
                        : "var(--verde-suave)",
                  }}
                >
                  {item.tipo === "negocio" ? "🏪" : "📢"}
                </div>
                <div className="info">
                  <b>{item.titulo}</b>
                  <span>
                    {item.detalle} · {tiempoRelativo(item.fecha)}
                  </span>
                </div>
                <div className="lado-derecho">
                  {item.estado === "por_verificar" ? (
                    <span className="pill pill-oro">Por verificar</span>
                  ) : item.estado === "pendiente" ? (
                    <span className="pill pill-oro">Pendiente</span>
                  ) : (
                    <span className="pill pill-verde">{item.tipo === "negocio" ? "Activo" : "Publicado"}</span>
                  )}
                  {vistaTodos ? (
                    <span className="pill pill-distrito">{nombreDistrito(item.distritoUbigeo)}</span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Resumen de validación</h3>
          </div>
          <div className="resumen-body">
            <div className="barra-resumen">
              <div className="seg-negocios" style={{ width: `${pctNegocios}%` }} />
              <div className="seg-avisos" style={{ width: `${pctAvisos}%` }} />
            </div>
            <div className="leyenda-resumen">
              <div className="leyenda-fila">
                <span className="punto" style={{ background: "var(--oro)" }} />
                Negocios pendientes
                <b>{negociosPendientes}</b>
              </div>
              <div className="leyenda-fila">
                <span className="punto" style={{ background: "var(--azul)" }} />
                Avisos pendientes
                <b>{avisosPendientes}</b>
              </div>
            </div>
            <Link to="/validacion" className="cta-validacion">
              Ir a Cola de validación →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
