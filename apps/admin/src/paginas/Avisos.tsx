import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Aviso, CategoriaAviso } from "@app-vecinos/tipos";
import { useAvisos } from "../estado/useAvisos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { useGeografia } from "../estado/useGeografia";

interface EstiloCategoria {
  icono: string;
  fondoVar: string;
  textoVar: string;
  etiqueta: string;
  descripcion: string;
}

export const ESTILO_CATEGORIA: Record<CategoriaAviso, EstiloCategoria> = {
  municipal: {
    icono: "🏛️",
    fondoVar: "var(--verde-suave)",
    textoVar: "var(--verde-fuerte)",
    etiqueta: "Municipal",
    descripcion: "Obras, servicios públicos",
  },
  junta_vecinal: {
    icono: "👥",
    fondoVar: "var(--oro-suave)",
    textoVar: "var(--oro)",
    etiqueta: "Junta vecinal",
    descripcion: "Reuniones y avisos vecinales",
  },
  seguridad: {
    icono: "🛡️",
    fondoVar: "var(--rojo-suave)",
    textoVar: "var(--rojo)",
    etiqueta: "Seguridad ciudadana",
    descripcion: "Serenazgo, alertas urgentes",
  },
  otro: {
    icono: "📣",
    fondoVar: "var(--superficie-hundida)",
    textoVar: "var(--texto-suave)",
    etiqueta: "Información / Otro",
    descripcion: "Cualquier otro anuncio",
  },
};

const CATEGORIAS: CategoriaAviso[] = ["municipal", "junta_vecinal", "seguridad", "otro"];

function formatearFechaCorta(iso: string): string {
  const fecha = new Date(iso);
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${fecha.getDate().toString().padStart(2, "0")} ${meses[fecha.getMonth()]}`;
}

export function Avisos() {
  const token = useSesionAdmin((estado) => estado.token)!;
  const avisos = useAvisos((estado) => estado.avisos);
  const cargandoAvisos = useAvisos((estado) => estado.cargando);
  const errorAvisos = useAvisos((estado) => estado.error);
  const cargarTodos = useAvisos((estado) => estado.cargarTodos);
  const crear = useAvisos((estado) => estado.crear);
  const eliminar = useAvisos((estado) => estado.eliminar);

  useEffect(() => {
    cargarTodos(token);
  }, [cargarTodos, token]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<"todas" | CategoriaAviso>("todas");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);

  const confirmandoEliminar = avisos.find((a) => a.id === confirmandoEliminarId) ?? null;

  const resumen = useMemo(
    () => ({
      total: avisos.length,
      publicados: avisos.filter((a) => a.estado === "publicado").length,
      pendientes: avisos.filter((a) => a.estado === "pendiente").length,
      rechazados: avisos.filter((a) => a.estado === "rechazado").length,
    }),
    [avisos]
  );

  const avisosFiltrados = avisos
    .filter((a) => filtroCategoria === "todas" || a.categoria === filtroCategoria)
    .filter(
      (a) =>
        a.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.fuenteNombre.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => b.publicadoEn.localeCompare(a.publicadoEn));

  async function alPublicar(datos: {
    comunidadId: string;
    fuenteNombre: string;
    fuenteVerificada: boolean;
    titulo: string;
    cuerpo: string;
    categoria: CategoriaAviso;
  }) {
    const ok = await crear(datos, token);
    if (ok) setModalAbierto(false);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Avisos</h2>
          <p>Contenido oficial que publicas directo — sin pasar por validación</p>
        </div>
        <button className="btn btn-primario" onClick={() => setModalAbierto(true)}>
          ＋ Nuevo aviso
        </button>
      </div>

      {errorAvisos ? (
        <div className="nota-alerta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {errorAvisos}</span>
          <button className="btn-accion-mini" onClick={() => cargarTodos(token)}>
            Reintentar
          </button>
        </div>
      ) : null}

      {cargandoAvisos && avisos.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Cargando avisos…
        </div>
      ) : (
      <>
      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>📢</div>
          <div>
            <b>{resumen.total}</b>
            <span>Avisos en total</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>✅</div>
          <div>
            <b>{resumen.publicados}</b>
            <span>Publicados</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--oro-suave)" }}>⏳</div>
          <div>
            <b>{resumen.pendientes}</b>
            <span>En revisión (Junta vecinal)</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--rojo-suave)" }}>✕</div>
          <div>
            <b>{resumen.rechazados}</b>
            <span>Rechazados</span>
          </div>
        </div>
      </div>

      <div className="nota-info">
        ℹ️ Aquí ves todos los avisos de la comunidad — los tuyos y los que redacta Junta Vecinal. Lo que
        publicas desde "+ Nuevo aviso" sale directo, sin pasar por la cola. Lo que envía Junta Vecinal sí pasa
        por ahí — revísalo en <Link to="/validacion">Validación</Link>.
      </div>

      <div className="buscador-mini" style={{ marginBottom: 16, boxShadow: "var(--sombra)" }}>
        🔍
        <input placeholder="Buscar por título o fuente…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <div className="fila-filtro" style={{ marginBottom: 16 }}>
        <button className={`chip-filtro ${filtroCategoria === "todas" ? "activo" : ""}`} onClick={() => setFiltroCategoria("todas")}>
          Todas ({avisos.length})
        </button>
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            className={`chip-filtro ${filtroCategoria === cat ? "activo" : ""}`}
            onClick={() => setFiltroCategoria(cat)}
          >
            {ESTILO_CATEGORIA[cat].icono} {ESTILO_CATEGORIA[cat].etiqueta} ({avisos.filter((a) => a.categoria === cat).length})
          </button>
        ))}
      </div>

      <div className="lista-avisos-admin">
        {avisosFiltrados.map((aviso) => {
          const estilo = ESTILO_CATEGORIA[aviso.categoria];
          return (
            <div className="fila-aviso-admin" key={aviso.id}>
              <div className="icono-cat-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                {estilo.icono}
              </div>
              <div className="info-aviso-admin">
                <b>{aviso.titulo}</b>
                <span className="fuente-aviso-admin">
                  {aviso.fuenteNombre}
                  {aviso.fuenteVerificada ? <span className="tick-verificado"> ✓ Verificada</span> : null} ·{" "}
                  {formatearFechaCorta(aviso.publicadoEn)}
                </span>
                <span className="resumen-cuerpo">{aviso.cuerpo}</span>
              </div>
              <span className={`estado-aviso-pill ${aviso.estado}`}>
                {aviso.estado === "publicado" ? "✅ Publicado" : aviso.estado === "pendiente" ? "⏳ En revisión" : "✕ Rechazado"}
              </span>
              <button className="btn-eliminar-aviso" onClick={() => setConfirmandoEliminarId(aviso.id)}>
                🗑️
              </button>
            </div>
          );
        })}
        {avisosFiltrados.length === 0 ? (
          <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
            Ningún aviso coincide con el filtro.
          </div>
        ) : null}
      </div>
      </>
      )}

      {modalAbierto ? <ModalNuevoAviso onCancelar={() => setModalAbierto(false)} onPublicar={alPublicar} /> : null}

      {confirmandoEliminar ? (
        <div className="overlay-modal" onClick={() => setConfirmandoEliminarId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>¿Eliminar este aviso?</h3>
            <p className="sub">Esta acción no se puede deshacer. Deja de mostrarse de inmediato en la app.</p>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setConfirmandoEliminarId(null)}>
                Cancelar
              </button>
              <button
                className="btn-eliminar-confirmar"
                onClick={async () => {
                  const ok = await eliminar(confirmandoEliminar.id, token);
                  if (ok) setConfirmandoEliminarId(null);
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

function ModalNuevoAviso({
  onCancelar,
  onPublicar,
}: {
  onCancelar: () => void;
  onPublicar: (datos: {
    comunidadId: string;
    fuenteNombre: string;
    fuenteVerificada: boolean;
    titulo: string;
    cuerpo: string;
    categoria: CategoriaAviso;
  }) => void;
}) {
  const comunidades = useGeografia((estado) => estado.comunidades);
  const [categoria, setCategoria] = useState<CategoriaAviso>("municipal");
  const [comunidadId, setComunidadId] = useState(comunidades[0]?.id ?? "");
  const [fuenteNombre, setFuenteNombre] = useState("Municipalidad de San Borja");
  const [fuenteVerificada, setFuenteVerificada] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");

  const estilo = ESTILO_CATEGORIA[categoria];
  const valido = Boolean(titulo.trim() && cuerpo.trim() && fuenteNombre.trim() && comunidadId);

  function confirmar() {
    if (!valido) return;
    onPublicar({
      comunidadId,
      fuenteNombre: fuenteNombre.trim(),
      fuenteVerificada,
      titulo: titulo.trim(),
      cuerpo: cuerpo.trim(),
      categoria,
    });
  }

  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card" style={{ width: "min(720px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo aviso</h3>
        <p className="sub">Se publica de inmediato — no pasa por la cola de validación.</p>

        <div className="layout-editor">
          <div>
            <div className="campo-modal">
              <label>Categoría</label>
              <div className="categoria-select-tipo">
                {CATEGORIAS.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    className={`opcion-categoria ${categoria === cat ? "selec" : ""}`}
                    onClick={() => setCategoria(cat)}
                  >
                    <span className="icono-op-cat" style={{ background: ESTILO_CATEGORIA[cat].fondoVar, color: ESTILO_CATEGORIA[cat].textoVar }}>
                      {ESTILO_CATEGORIA[cat].icono}
                    </span>
                    <div>
                      <b>{ESTILO_CATEGORIA[cat].etiqueta}</b>
                      <span>{ESTILO_CATEGORIA[cat].descripcion}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="fila-2-campos">
              <div className="campo-modal">
                <label>Comunidad</label>
                <select value={comunidadId} onChange={(e) => setComunidadId(e.target.value)}>
                  {comunidades.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo-modal">
                <label>Fuente</label>
                <input value={fuenteNombre} onChange={(e) => setFuenteNombre(e.target.value)} placeholder="Ej. Serenazgo San Borja" />
              </div>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11.5,
                fontWeight: 700,
                color: "var(--texto-suave)",
                marginBottom: 14,
                cursor: "pointer",
              }}
            >
              <input type="checkbox" checked={fuenteVerificada} onChange={(e) => setFuenteVerificada(e.target.checked)} style={{ width: "auto" }} />
              Fuente verificada (muestra la insignia ✓ — solo para fuentes oficiales reales)
            </label>

            <div className="campo-modal">
              <label>Título</label>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Corte de agua programado" autoFocus />
            </div>
            <div className="campo-modal" style={{ marginBottom: 0 }}>
              <label>Cuerpo</label>
              <textarea
                rows={4}
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                placeholder="Ej. Sedapal informa corte de agua el jueves de 9:00 a 17:00…"
              />
            </div>
          </div>

          <div className="panel-referencia" style={{ position: "static" }}>
            <h3 style={{ fontSize: 12.5 }}>Vista previa</h3>
            <p className="sub-ref">Así lo verán los vecinos en Notificaciones → Avisos.</p>
            <div className="telefono">
              <div className="pantalla-tel">
                <div className="mini-tarjeta-aviso">
                  <div className="mini-cab-aviso">
                    <div className="mini-avatar-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                      {estilo.icono}
                    </div>
                    <div className="mini-info-fuente">
                      <div className="mini-fila-fuente">
                        <span className="mini-fuente-aviso">{fuenteNombre || "Nombre de la fuente"}</span>
                        {fuenteVerificada ? <span className="mini-tick-aviso">✓</span> : null}
                      </div>
                      <span className="mini-fecha-aviso">Ahora mismo</span>
                    </div>
                    <span className="mini-pill-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                      {estilo.etiqueta}
                    </span>
                  </div>
                  <div className="mini-cuerpo-aviso-cont">
                    <span className="mini-titulo-aviso">{titulo || "Título del aviso"}</span>
                    <span className="mini-cuerpo-aviso">{cuerpo || "Cuerpo del aviso…"}</span>
                  </div>
                  <div className="mini-pie-aviso">
                    <span className="mini-accion-aviso">🤍 0</span>
                    <span className="mini-accion-aviso">📤 0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-crear" disabled={!valido} onClick={confirmar}>
            Publicar aviso
          </button>
        </div>
      </div>
    </div>
  );
}
