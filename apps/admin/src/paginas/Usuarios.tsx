import { useEffect, useMemo, useState } from "react";
import { useUsuarios } from "../estado/useUsuarios";
import { useGeografia } from "../estado/useGeografia";
import { useSesionAdmin } from "../estado/useSesionAdmin";

function iniciales(nombre: string, apellido: string): string {
  return ((nombre[0] ?? "") + (apellido[0] ?? "")).toUpperCase();
}

function formatearFecha(iso: string | null): string {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function Usuarios() {
  const token = useSesionAdmin((estado) => estado.token)!;
  const usuarios = useUsuarios((estado) => estado.usuarios);
  const cargando = useUsuarios((estado) => estado.cargando);
  const error = useUsuarios((estado) => estado.error);
  const cargar = useUsuarios((estado) => estado.cargar);
  const cargarMas = useUsuarios((estado) => estado.cargarMas);
  const cursorSiguiente = useUsuarios((estado) => estado.cursorSiguiente);
  const cargandoMas = useUsuarios((estado) => estado.cargandoMas);
  const alternarBloqueo = useUsuarios((estado) => estado.alternarBloqueo);
  const eliminar = useUsuarios((estado) => estado.eliminar);
  const comunidades = useGeografia((estado) => estado.comunidades);

  const [busqueda, setBusqueda] = useState("");
  const [filtroComunidad, setFiltroComunidad] = useState("todas");
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);

  useEffect(() => {
    cargar(token);
  }, [cargar, token]);

  const confirmandoEliminar = usuarios.find((u) => u.id === confirmandoEliminarId) ?? null;
  const comunidadPorId = useMemo(() => Object.fromEntries(comunidades.map((c) => [c.id, c])), [comunidades]);

  const resumen = useMemo(
    () => ({
      total: usuarios.length,
      activos: usuarios.filter((u) => u.estado === "activo").length,
      bloqueados: usuarios.filter((u) => u.estado === "bloqueado").length,
      comunidades: new Set(usuarios.map((u) => u.comunidadId)).size,
    }),
    [usuarios]
  );

  const usuariosFiltrados = usuarios
    .filter((u) => filtroComunidad === "todas" || u.comunidadId === filtroComunidad)
    .filter((u) => {
      const texto = `${u.nombre} ${u.apellido} ${u.correo} ${u.telefono}`.toLowerCase();
      return texto.includes(busqueda.toLowerCase());
    })
    .sort((a, b) => b.registradoEn.localeCompare(a.registradoEn));

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Usuarios</h2>
          <p>Vecinos registrados en la app móvil</p>
        </div>
      </div>

      {error ? (
        <div className="nota-alerta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {error}</span>
          <button className="btn-accion-mini" onClick={() => cargar(token)}>
            Reintentar
          </button>
        </div>
      ) : null}

      {cargando && usuarios.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Cargando vecinos…
        </div>
      ) : (
        <>
          <div className="resumen-mini">
            <div className="mini-stat">
              <div className="icono" style={{ background: "var(--azul-suave)" }}>👤</div>
              <div>
                <b>{resumen.total}</b>
                <span>Usuarios registrados</span>
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
              <div className="icono" style={{ background: "var(--rojo-suave)" }}>🚫</div>
              <div>
                <b>{resumen.bloqueados}</b>
                <span>Bloqueados</span>
              </div>
            </div>
            <div className="mini-stat">
              <div className="icono" style={{ background: "var(--oro-suave)" }}>📍</div>
              <div>
                <b>{resumen.comunidades}</b>
                <span>Comunidades con usuarios</span>
              </div>
            </div>
          </div>

          <div className="barra-filtros">
            <div className="buscador-mini">
              🔍
              <input placeholder="Buscar por nombre, correo o teléfono…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div className="fila-filtro">
              <button className={`chip-filtro ${filtroComunidad === "todas" ? "activo" : ""}`} onClick={() => setFiltroComunidad("todas")}>
                Todas las comunidades
              </button>
              {comunidades.map((c) => (
                <button
                  key={c.id}
                  className={`chip-filtro ${filtroComunidad === c.id ? "activo" : ""}`}
                  onClick={() => setFiltroComunidad(c.id)}
                >
                  📍 {c.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="lista-cuentas">
            {usuariosFiltrados.map((usuario) => (
              <div className={`fila-cuenta ${usuario.estado === "bloqueado" ? "inactiva" : ""}`} key={usuario.id}>
                <div className="avatar-rol" style={{ background: usuario.estado === "activo" ? "var(--azul)" : "var(--texto-tenue)" }}>
                  {iniciales(usuario.nombre, usuario.apellido)}
                </div>
                <div className="info-cuenta">
                  <b>
                    {usuario.nombre} {usuario.apellido}
                  </b>
                  <span className="correo-cuenta">{usuario.correo}</span>
                  <span className="correo-cuenta" style={{ opacity: 0.7 }}>{usuario.telefono}</span>
                </div>
                <span className="rol-pill" style={{ background: "var(--azul-suave)", color: "var(--azul)" }}>
                  📍 {comunidadPorId[usuario.comunidadId]?.nombre ?? "Sin comunidad"}
                </span>
                <span style={{ fontSize: 10.5, color: "var(--texto-tenue)", flex: "none", width: 160 }}>
                  Registrado {formatearFecha(usuario.registradoEn)}
                  <br />
                  Último acceso: {formatearFecha(usuario.ultimoAccesoEn)}
                </span>
                <span className={`estado-cuenta-pill ${usuario.estado === "activo" ? "activa" : "desactivada"}`}>
                  {usuario.estado === "activo" ? "Activo" : "Bloqueado"}
                </span>
                <div style={{ display: "flex", gap: 6, flex: "none" }}>
                  <button
                    className={`btn-accion-mini ${usuario.estado === "activo" ? "desactivar" : "activar"}`}
                    onClick={() => alternarBloqueo(usuario.id, token)}
                  >
                    {usuario.estado === "activo" ? "🚫 Bloquear" : "✅ Reactivar"}
                  </button>
                  <button className="btn-accion-mini desactivar" onClick={() => setConfirmandoEliminarId(usuario.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {usuariosFiltrados.length === 0 ? (
              <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
                {usuarios.length === 0 ? "Todavía no hay vecinos registrados." : "Ningún usuario coincide con el filtro."}
              </div>
            ) : null}
          </div>
          {cursorSiguiente ? (
            <button
              className="btn-accion-mini"
              style={{ display: "block", margin: "16px auto 0" }}
              disabled={cargandoMas}
              onClick={() => cargarMas(token)}
            >
              {cargandoMas ? "Cargando…" : "Cargar más vecinos"}
            </button>
          ) : null}
        </>
      )}

      {confirmandoEliminar ? (
        <div className="overlay-modal" onClick={() => setConfirmandoEliminarId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>¿Eliminar a {confirmandoEliminar.nombre} {confirmandoEliminar.apellido}?</h3>
            <p className="sub">Esta acción no se puede deshacer.</p>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setConfirmandoEliminarId(null)}>
                Cancelar
              </button>
              <button
                className="btn-eliminar-confirmar"
                onClick={() => {
                  eliminar(confirmandoEliminar.id, token);
                  setConfirmandoEliminarId(null);
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
