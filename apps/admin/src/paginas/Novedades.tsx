import { useEffect, useMemo, useState } from "react";
import { Novedad } from "@app-vecinos/tipos";
import { useNovedades } from "../estado/useNovedades";
import { useSesionAdmin } from "../estado/useSesionAdmin";

const LIMITE_TEXTO = 140;

function formatearFechaCorta(iso: string): string {
  const fecha = new Date(iso);
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${fecha.getDate().toString().padStart(2, "0")} ${meses[fecha.getMonth()]}`;
}

export function Novedades() {
  const novedades = useNovedades((estado) => estado.novedades);
  const cargando = useNovedades((estado) => estado.cargando);
  const error = useNovedades((estado) => estado.error);
  const cargar = useNovedades((estado) => estado.cargar);
  const crear = useNovedades((estado) => estado.crear);
  const actualizar = useNovedades((estado) => estado.actualizar);
  const eliminar = useNovedades((estado) => estado.eliminar);
  const alternarActivo = useNovedades((estado) => estado.alternarActivo);
  const token = useSesionAdmin((estado) => estado.token);

  useEffect(() => {
    if (token) cargar(token);
  }, [cargar, token]);

  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [novedadEditandoId, setNovedadEditandoId] = useState<string | null>(null);
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);

  const novedadEditando = novedades.find((n) => n.id === novedadEditandoId) ?? null;
  const confirmandoEliminar = novedades.find((n) => n.id === confirmandoEliminarId) ?? null;

  const resumen = useMemo(
    () => ({
      total: novedades.length,
      visibles: novedades.filter((n) => n.activo).length,
      ocultas: novedades.filter((n) => !n.activo).length,
    }),
    [novedades]
  );

  const novedadesFiltradas = novedades.filter(
    (n) =>
      n.titulo.toLowerCase().includes(busqueda.toLowerCase()) || n.texto.toLowerCase().includes(busqueda.toLowerCase())
  );

  const ejemploVisible = novedades.filter((n) => n.activo).slice(0, 2);

  async function alGuardar(titulo: string, texto: string) {
    if (!token) return;
    if (novedadEditando) {
      await actualizar(novedadEditando.id, titulo, texto, token);
    } else {
      await crear(titulo, texto, token);
    }
    setModalAbierto(false);
    setNovedadEditandoId(null);
  }

  if (cargando && novedades.length === 0) {
    return <div className="panel" style={{ padding: 32, textAlign: "center" }}>Cargando novedades…</div>;
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Novedades</h2>
          <p>Lo que ven los vecinos en Notificaciones → "Novedades"</p>
        </div>
        <button
          className="btn btn-primario"
          onClick={() => {
            setNovedadEditandoId(null);
            setModalAbierto(true);
          }}
        >
          ＋ Nueva novedad
        </button>
      </div>

      {error ? (
        <div className="panel" style={{ padding: 12, marginBottom: 16, color: "var(--rojo)", background: "var(--rojo-suave)" }}>
          {error}
        </div>
      ) : null}

      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>✨</div>
          <div>
            <b>{resumen.total}</b>
            <span>Total novedades</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>👁️</div>
          <div>
            <b>{resumen.visibles}</b>
            <span>Visibles ahora</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "#eceae2" }}>🙈</div>
          <div>
            <b>{resumen.ocultas}</b>
            <span>Ocultas</span>
          </div>
        </div>
      </div>

      <div className="layout-novedades">
        <div>
          <div className="buscador-mini">
            🔍
            <input placeholder="Buscar novedad…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>

          <div className="lista-novedades">
            {novedadesFiltradas.map((novedad) => (
              <div className={`fila-novedad ${novedad.activo ? "" : "oculta"}`} key={novedad.id}>
                <div className="icono-novedad">✨</div>
                <div className="info-novedad">
                  <b>{novedad.titulo}</b>
                  <span className="texto-nov">{novedad.texto}</span>
                </div>
                <span className="fecha-nov">{formatearFechaCorta(novedad.publicadoEn)}</span>
                <span className={`estado-nov-pill ${novedad.activo ? "visible" : "oculta"}`}>
                  {novedad.activo ? "Visible" : "Oculta"}
                </span>
                <div className="fila-acciones-nov">
                  <button
                    className="btn-accion-mini"
                    onClick={() => {
                      setNovedadEditandoId(novedad.id);
                      setModalAbierto(true);
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-accion-mini ocultar"
                    onClick={() => token && alternarActivo(novedad.id, token)}
                  >
                    {novedad.activo ? "🙈 Ocultar" : "👁️ Mostrar"}
                  </button>
                  <button className="btn-accion-mini eliminar" onClick={() => setConfirmandoEliminarId(novedad.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {novedadesFiltradas.length === 0 ? (
              <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
                No hay novedades que coincidan con el filtro.
              </div>
            ) : null}
          </div>
        </div>

        <div className="panel-referencia">
          <h3>¿Dónde se ve esto?</h3>
          <p className="sub-ref">
            Tal cual aparece en Notificaciones — es la última sección del scroll, después de Alertas, Avisos y
            Ofertas.
          </p>

          <div className="etiqueta-pantalla">Notificaciones</div>
          <div className="telefono">
            <div className="pantalla-tel">
              <div className="mini-titulo-seccion">Novedades</div>
              {ejemploVisible.length === 0 ? (
                <p className="sin-ejemplo">Ninguna novedad visible todavía.</p>
              ) : (
                ejemploVisible.map((novedad, i) => (
                  <div className="mini-tarjeta-notif" key={novedad.id}>
                    <div className="mini-icono-notif">✨</div>
                    <div className="mini-cuerpo">
                      <b>{novedad.titulo}</b>
                      <span className="mini-texto-notif">{novedad.texto}</span>
                      <span className="mini-pill-notif">Novedades de la app</span>
                    </div>
                    {i === 0 ? <div className="mini-punto-noleido" /> : null}
                  </div>
                ))
              )}
            </div>
          </div>
          <p className="nota-mini">
            Tarjeta blanca simple, sin hora (a diferencia de Avisos). Tocarla solo la marca como leída — no navega
            a ningún lado, y así debe quedarse.
          </p>
        </div>
      </div>

      {modalAbierto ? (
        <ModalNovedad
          novedad={novedadEditando}
          onCancelar={() => {
            setModalAbierto(false);
            setNovedadEditandoId(null);
          }}
          onGuardar={alGuardar}
        />
      ) : null}

      {confirmandoEliminar ? (
        <ModalConfirmarEliminarNovedad
          novedad={confirmandoEliminar}
          onCancelar={() => setConfirmandoEliminarId(null)}
          onConfirmar={async () => {
            if (token) await eliminar(confirmandoEliminar.id, token);
            setConfirmandoEliminarId(null);
          }}
        />
      ) : null}
    </>
  );
}

function ModalNovedad({
  novedad,
  onCancelar,
  onGuardar,
}: {
  novedad: Novedad | null;
  onCancelar: () => void;
  onGuardar: (titulo: string, texto: string) => void;
}) {
  const [titulo, setTitulo] = useState(novedad?.titulo ?? "");
  const [texto, setTexto] = useState(novedad?.texto ?? "");

  const valido = titulo.trim() && texto.trim();

  function confirmar() {
    if (!valido) return;
    onGuardar(titulo.trim(), texto.trim());
  }

  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{novedad ? "Editar novedad" : "Nueva novedad"}</h3>
        <p className="sub">Se publica de inmediato apenas guardas — sin pasos extra.</p>

        <div className="campo-modal">
          <label>Título</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Ahora puedes ver el horario completo" autoFocus />
        </div>
        <div className="campo-modal">
          <label>Texto</label>
          <textarea
            rows={3}
            maxLength={LIMITE_TEXTO}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej. Toca “Ver horario completo” en cualquier negocio para ver sus 7 días."
          />
          <div className="contador-caracteres">
            {texto.length} / {LIMITE_TEXTO} — se corta a 2 líneas en la tarjeta
          </div>
        </div>

        {titulo.trim() || texto.trim() ? (
          <div className="vista-previa-tarjeta">
            <div className="etiqueta-pantalla">Así se verá</div>
            <div className="mini-tarjeta-notif previa">
              <div className="mini-icono-notif">✨</div>
              <div className="mini-cuerpo">
                <b>{titulo.trim() || "Título de la novedad"}</b>
                <span className="mini-texto-notif">{texto.trim() || "Texto breve de la novedad."}</span>
                <span className="mini-pill-notif">Novedades de la app</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-crear" disabled={!valido} onClick={confirmar}>
            {novedad ? "Guardar cambios" : "Publicar novedad"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalConfirmarEliminarNovedad({
  novedad,
  onCancelar,
  onConfirmar,
}: {
  novedad: Novedad;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div className="icono-alerta">⚠️</div>
        <h3>¿Eliminar esta novedad?</h3>
        <p className="sub">Esta acción no se puede deshacer. Dejará de mostrarse de inmediato en la app.</p>

        <div className="fila-novedad" style={{ textAlign: "left", boxShadow: "none", background: "var(--superficie-hundida)" }}>
          <div className="icono-novedad">✨</div>
          <div className="info-novedad">
            <b>{novedad.titulo}</b>
            <span className="texto-nov">Publicada el {formatearFechaCorta(novedad.publicadoEn)}</span>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: 18 }}>
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-eliminar-confirmar" onClick={onConfirmar}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
