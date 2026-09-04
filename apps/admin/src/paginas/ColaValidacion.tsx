import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { useNegocios } from "../estado/useNegocios";
import { useAvisos } from "../estado/useAvisos";
import { useGeografia } from "../estado/useGeografia";
import { distritoDeComunidad } from "../utilidades/alcance";

type ItemCola =
  | { tipo: "negocio"; id: string; titulo: string; subtitulo: string; distritoUbigeo: string; detalle: string; enviadoEn: string }
  | { tipo: "aviso"; id: string; titulo: string; subtitulo: string; distritoUbigeo: string; detalle: string; enviadoEn: string };

function tiempoRelativoSimple(iso: string): string {
  const minutos = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.round(horas / 24)} día(s)`;
}

export function ColaValidacion() {
  const cuenta = useSesionAdmin((estado) => estado.cuenta)!;
  const token = useSesionAdmin((estado) => estado.token)!;
  const negocios = useNegocios((estado) => estado.negocios);
  const cargandoNegocios = useNegocios((estado) => estado.cargando);
  const errorNegocios = useNegocios((estado) => estado.error);
  const cargarNegociosPendientes = useNegocios((estado) => estado.cargarPendientes);
  const avisos = useAvisos((estado) => estado.avisos);
  const cargandoAvisos = useAvisos((estado) => estado.cargando);
  const errorAvisos = useAvisos((estado) => estado.error);
  const cargarAvisosPendientes = useAvisos((estado) => estado.cargarPendientes);
  const aprobarNegocio = useNegocios((estado) => estado.aprobar);
  const rechazarNegocio = useNegocios((estado) => estado.rechazar);
  const aprobarAviso = useAvisos((estado) => estado.aprobar);
  const rechazarAviso = useAvisos((estado) => estado.rechazar);
  const distritos = useGeografia((estado) => estado.distritos);
  const comunidades = useGeografia((estado) => estado.comunidades);

  useEffect(() => {
    cargarAvisosPendientes(token);
    cargarNegociosPendientes(token);
  }, [cargarAvisosPendientes, cargarNegociosPendientes, token]);

  const [filtroTipo, setFiltroTipo] = useState<"todo" | "negocio" | "aviso">("todo");
  const [filtroDistrito, setFiltroDistrito] = useState("todos");
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const distritoPorUbigeo = useMemo(
    () => Object.fromEntries(distritos.map((d) => [d.ubigeo, d.nombre])),
    [distritos]
  );

  /** Solo los distritos dentro del alcance de esta cuenta — para el validador de un solo distrito, esta lista tiene 1 elemento y el filtro ni se muestra. */
  const distritosDisponibles = useMemo(
    () =>
      cuenta.distritosAsignados.length === 0
        ? distritos
        : distritos.filter((d) => cuenta.distritosAsignados.includes(d.ubigeo)),
    [cuenta, distritos]
  );

  const items: ItemCola[] = useMemo(() => {
    // negocios ya viene filtrado por el servidor a "por_verificar" + alcance de esta cuenta
    // (GET /negocios/pendientes) — no hace falta repetir ese filtro acá.
    const pendientesNegocio: ItemCola[] = negocios
      .map((n) => ({
        tipo: "negocio",
        id: n.id,
        titulo: n.nombre,
        subtitulo: `${distritoPorUbigeo[n.distritoUbigeo] ?? n.distritoUbigeo} · ${
          n.verificadoEn ? "edición" : "alta nueva"
        }`,
        distritoUbigeo: n.distritoUbigeo,
        detalle: n.descripcion,
        enviadoEn: n.actualizadoEn,
      }));

    // avisos ya viene filtrado por el servidor a "pendiente" + alcance de esta cuenta
    // (GET /avisos/pendientes) — no hace falta repetir ese filtro acá.
    const pendientesAviso: ItemCola[] = avisos
      .map((a) => {
        const distritoUbigeo = distritoDeComunidad(comunidades, a.comunidadId);
        return {
          tipo: "aviso",
          id: a.id,
          titulo: a.titulo,
          subtitulo: `${distritoPorUbigeo[distritoUbigeo] ?? ""} · ${a.fuenteNombre}`,
          distritoUbigeo,
          detalle: a.cuerpo,
          enviadoEn: a.publicadoEn,
        };
      });

    let combinados = [...pendientesNegocio, ...pendientesAviso].sort((a, b) =>
      b.enviadoEn.localeCompare(a.enviadoEn)
    );
    if (filtroTipo !== "todo") combinados = combinados.filter((i) => i.tipo === filtroTipo);
    if (filtroDistrito !== "todos") combinados = combinados.filter((i) => i.distritoUbigeo === filtroDistrito);
    return combinados;
  }, [negocios, avisos, cuenta, comunidades, distritoPorUbigeo, filtroTipo, filtroDistrito]);

  const seleccionado = items.find((i) => i.id === seleccionId) ?? items[0] ?? null;

  const totalNegocios = items.filter((i) => i.tipo === "negocio").length;
  const totalAvisos = items.filter((i) => i.tipo === "aviso").length;

  const masAntiguo = useMemo(() => {
    if (items.length === 0) return null;
    const fechaMasAntigua = items.reduce((min, i) => (i.enviadoEn < min ? i.enviadoEn : min), items[0].enviadoEn);
    const dias = Math.max(0, Math.round((Date.now() - new Date(fechaMasAntigua).getTime()) / 86400000));
    if (dias === 0) return "hoy";
    return `${dias} día${dias === 1 ? "" : "s"}`;
  }, [items]);

  async function alAprobar() {
    if (!seleccionado) return;
    if (seleccionado.tipo === "negocio") await aprobarNegocio(seleccionado.id, token);
    else await aprobarAviso(seleccionado.id, token);
    setSeleccionId(null);
    setMotivo("");
  }

  async function alRechazar() {
    if (!seleccionado) return;
    if (!motivo.trim()) return;
    if (seleccionado.tipo === "negocio") await rechazarNegocio(seleccionado.id, motivo.trim(), token);
    else await rechazarAviso(seleccionado.id, motivo.trim(), token);
    setSeleccionId(null);
    setMotivo("");
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Cola de validación</h2>
          <p>{items.length} pendientes en tus distritos asignados</p>
        </div>
        <Link className="link-historial" to="/validacion/historial">
          Ver historial →
        </Link>
      </div>

      {errorNegocios || errorAvisos ? (
        <div className="nota-alerta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {errorNegocios ?? errorAvisos}</span>
          <button
            className="btn-accion-mini"
            onClick={() => {
              cargarNegociosPendientes(token);
              cargarAvisosPendientes(token);
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--oro-suave)" }}>⏳</div>
          <div>
            <b>{items.length}</b>
            <span>Total pendientes</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>🏪</div>
          <div>
            <b>{totalNegocios}</b>
            <span>Negocios</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>📢</div>
          <div>
            <b>{totalAvisos}</b>
            <span>Avisos</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--coral-suave)" }}>⏱️</div>
          <div>
            <b>{masAntiguo ?? "—"}</b>
            <span>Más antiguo</span>
          </div>
        </div>
      </div>

      <div className="fila-filtro" style={{ marginBottom: 16 }}>
        <button className={`chip-filtro ${filtroTipo === "todo" ? "activo" : ""}`} onClick={() => setFiltroTipo("todo")}>
          Todo ({totalNegocios + totalAvisos})
        </button>
        <button className={`chip-filtro ${filtroTipo === "negocio" ? "activo" : ""}`} onClick={() => setFiltroTipo("negocio")}>
          🏪 Negocios ({totalNegocios})
        </button>
        <button className={`chip-filtro ${filtroTipo === "aviso" ? "activo" : ""}`} onClick={() => setFiltroTipo("aviso")}>
          📢 Avisos ({totalAvisos})
        </button>
      </div>

      {distritosDisponibles.length > 1 ? (
        <div className="fila-filtro" style={{ marginBottom: 16 }}>
          <button
            className={`chip-filtro ${filtroDistrito === "todos" ? "activo" : ""}`}
            onClick={() => setFiltroDistrito("todos")}
          >
            🌎 Todos los distritos
          </button>
          {distritosDisponibles.map((d) => (
            <button
              key={d.ubigeo}
              className={`chip-filtro ${filtroDistrito === d.ubigeo ? "activo" : ""}`}
              onClick={() => setFiltroDistrito(d.ubigeo)}
            >
              📍 {d.nombre}
            </button>
          ))}
        </div>
      ) : null}

      {(cargandoNegocios || cargandoAvisos) && items.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Cargando cola de validación…
        </div>
      ) : items.length === 0 ? (
        <div className="estado-vacio-cola">
          <div className="emoji-vacio">🎉</div>
          <p>
            <b style={{ color: "var(--texto)" }}>Todo al día.</b>
            <br />
            No hay nada pendiente por revisar en tus distritos asignados.
          </p>
        </div>
      ) : (
        <div className="layout-cola">
          <div className="lista-cola">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSeleccionId(item.id);
                  setMotivo("");
                }}
                className={`item-cola ${seleccionado?.id === item.id ? "seleccionado" : ""}`}
              >
                <div className={`icono-item-cola ${item.tipo}`}>{item.tipo === "negocio" ? "🏪" : "📢"}</div>
                <div className="info-item-cola">
                  <b>{item.titulo}</b>
                  <span>{item.subtitulo}</span>
                </div>
                <span className="tiempo-cola">{tiempoRelativoSimple(item.enviadoEn)}</span>
              </div>
            ))}
          </div>

          {seleccionado ? (
            <div className="panel-detalle">
              <div className="cabecera-detalle">
                <div>
                  <h3>{seleccionado.titulo}</h3>
                  <div className="meta-detalle">
                    {seleccionado.tipo === "negocio" ? "Negocio" : "Aviso"} · {seleccionado.subtitulo}
                  </div>
                </div>
                <span className="pill-pendiente">Pendiente</span>
              </div>

              <div className="seccion-detalle">
                <div className="etiqueta">Contenido enviado</div>
                <div className="caja-contenido">{seleccionado.detalle}</div>
              </div>

              <div className="seccion-detalle campo-motivo">
                <div className="etiqueta">Motivo (obligatorio solo si rechazas)</div>
                <textarea
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: la dirección no coincide con el mapa, verificar antes de aprobar…"
                />
                <div className="nota-motivo">Se lo compartimos con quien lo envió para que pueda corregir y reenviar.</div>
              </div>

              <div className="fila-acciones-validacion">
                <button className="btn-rechazar" disabled={!motivo.trim()} onClick={alRechazar}>
                  ✕ Rechazar
                </button>
                <button className="btn-aprobar" onClick={alAprobar}>
                  ✓ Aprobar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
