import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowLeft, LuPin, LuSearch } from "react-icons/lu";
import { ComentarioPublicacion, FiltroComentarios, MOTIVOS_REPORTE, REPORTES_PARA_OCULTAR } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { avisarErrorParaTi, useParaTi } from "../estado/useParaTi";
import { alertaExito } from "../estado/useToasts";
import { urlCompleta } from "../utilidades/media";
import { NOMBRE_TIPO, avatarDe, fechaCorta, fondoTexto, haceCuanto, miles } from "../utilidades/paraTi";

const FILTROS: { id: FiltroComentarios; texto: string }[] = [
  { id: "reportados", texto: "Reportados" },
  { id: "todos", texto: "Todos" },
  { id: "ocultos", texto: "Ocultos" },
  { id: "sin_responder", texto: "Sin responder" },
];

function Verificado() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" role="img" aria-label="Cuenta oficial" className="verificado">
      <circle cx="12" cy="12" r="10" fill="#1a531a" />
      <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Avatar({ c, grande = false }: { c: ComentarioPublicacion; grande?: boolean }) {
  const av = c.oficial ? { iniciales: "EL", color: "#1a531a" } : avatarDe(c.autorNombre);
  return (
    <span className={`avatar-vecino ${grande ? "grande" : ""}`} style={{ background: av.color }}>
      {av.iniciales}
    </span>
  );
}

/** Bandeja de comentarios de Para ti (decisión 0092): filtros, lista y el comentario abierto. */
export function ParaTiComentarios() {
  const token = useSesionAdmin((e) => e.token)!;
  const {
    comentarios,
    cargarComentarios,
    cargando,
    resumenComentarios,
    cargarResumenComentarios,
    hilos,
    cargarHilo,
    moderarComentario,
    eliminarComentario,
    fijarComentario,
    responder,
    silenciar,
    permitirComentarios,
  } = useParaTi();
  const [filtro, setFiltro] = useState<FiltroComentarios>("reportados");
  const [busqueda, setBusqueda] = useState("");
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const detalle = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => cargarComentarios(filtro, token, busqueda), busqueda ? 300 : 0);
    return () => clearTimeout(t);
  }, [filtro, busqueda, token, cargarComentarios]);

  useEffect(() => {
    cargarResumenComentarios(token);
  }, [token, cargarResumenComentarios]);

  // Al cargar la lista se abre el primero (en pantallas anchas).
  useEffect(() => {
    if (!elegidoId && comentarios[0] && window.innerWidth > 1100) setElegidoId(comentarios[0].id);
  }, [comentarios, elegidoId]);

  const enLista = comentarios.find((c) => c.id === elegidoId);
  const hiloElegido = enLista ? hilos[enLista.publicacionId] : undefined;
  const elegido = hiloElegido?.find((c) => c.id === elegidoId) ? { ...enLista, ...hiloElegido.find((c) => c.id === elegidoId)! } : enLista;

  useEffect(() => {
    if (enLista) cargarHilo(enLista.publicacionId, token);
    setRespuesta("");
    setConfirmando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enLista?.id]);

  const principalId = elegido ? elegido.respuestaA ?? elegido.id : null;
  const principal = hiloElegido?.find((c) => c.id === principalId) ?? (elegido && !elegido.respuestaA ? elegido : undefined);
  const respuestas = (hiloElegido ?? []).filter((c) => c.respuestaA === principalId);

  function abrir(c: ComentarioPublicacion) {
    setElegidoId(c.id);
    if (window.innerWidth <= 1100) setTimeout(() => detalle.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function moderar(cambios: { oculto?: boolean; revisado?: boolean }, exito: string) {
    if (!elegido) return;
    if (await moderarComentario(elegido.id, cambios, token)) alertaExito(exito);
    else avisarErrorParaTi("No se pudo cambiar el comentario");
  }

  async function borrar() {
    if (!elegido) return;
    if (await eliminarComentario(elegido.id, token)) {
      alertaExito("Comentario eliminado");
      setElegidoId(null);
    } else avisarErrorParaTi("No se pudo eliminar");
  }

  async function silenciarVecino(dias: number) {
    if (!elegido?.usuarioId) return;
    const r = await silenciar(elegido.usuarioId, dias, token);
    if (r === false) return avisarErrorParaTi("No se pudo cambiar");
    alertaExito(r ? `${elegido.autorNombre} no podrá comentar hasta el ${fechaCorta(r)}` : `${elegido.autorNombre} ya puede comentar`);
  }

  async function enviar(fijar: boolean) {
    if (!elegido || !respuesta.trim()) return;
    setEnviando(true);
    const ok = await responder(elegido.publicacionId, respuesta.trim(), principalId ?? undefined, fijar, token);
    setEnviando(false);
    if (ok) {
      alertaExito(fijar ? "Respuesta publicada y fijada" : "Respuesta publicada");
      setRespuesta("");
    } else avisarErrorParaTi("No se pudo responder");
  }

  async function fijar(fijado: boolean) {
    if (!elegido) return;
    if (await fijarComentario(elegido, fijado, token)) alertaExito(fijado ? "Comentario fijado arriba" : "Comentario desfijado");
    else avisarErrorParaTi("No se pudo fijar");
  }

  async function alternarComentarios() {
    if (!elegido) return;
    const permite = !elegido.publicacionPermiteComentarios;
    if (await permitirComentarios(elegido.publicacionId, permite, token)) alertaExito(permite ? "Comentarios abiertos" : "Comentarios cerrados en esta publicación");
    else avisarErrorParaTi("No se pudo cambiar");
  }

  const reportado = (elegido?.reportes ?? 0) > 0 && !elegido?.revisado;
  const fijadoPrincipal = principal?.fijado ?? false;

  return (
    <div className="para-ti-admin bandeja-comentarios">
      <div className="cabecera-para-ti">
        <div>
          <h2>Comentarios</h2>
          <span className="fecha-para-ti">
            Con {REPORTES_PARA_OCULTAR} reportes un comentario se oculta solo hasta que lo revises.
          </span>
        </div>
        <label className="buscador-para-ti">
          <LuSearch aria-hidden />
          <span className="solo-lector">Buscar comentarios</span>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por vecino o texto…" />
        </label>
      </div>

      <div className="columnas-bandeja">
        <nav className="filtros-bandeja" aria-label="Filtros">
          {FILTROS.map((f) => {
            const n = resumenComentarios?.[f.id] ?? 0;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtro === f.id}
                className={filtro === f.id ? "activo" : ""}
                onClick={() => {
                  setFiltro(f.id);
                  setElegidoId(null);
                }}
              >
                <span>{f.texto}</span>
                <span className={`cuenta-filtro ${f.id === "reportados" && n > 0 ? "alerta" : ""}`}>{miles(n)}</span>
              </button>
            );
          })}
        </nav>

        <section className="lista-bandeja" aria-label="Lista de comentarios">
          {cargando && comentarios.length === 0 ? <p className="vacio-revisar">Cargando…</p> : null}
          {!cargando && comentarios.length === 0 ? (
            <p className="vacio-revisar">{filtro === "reportados" ? "Nada reportado. Todo en orden." : "No hay comentarios aquí."}</p>
          ) : null}
          {comentarios.map((c) => (
            <button key={c.id} type="button" className={`item-bandeja ${c.id === elegidoId ? "elegido" : ""} ${c.oculto ? "oculto" : ""}`} onClick={() => abrir(c)}>
              <Avatar c={c} />
              <span className="cuerpo-item-bandeja">
                <span className="meta-item-bandeja">
                  <b>{c.autorNombre}</b>
                  {c.oficial ? <Verificado /> : null}
                  <span>· {haceCuanto(c.creadoEn)}</span>
                  {(c.reportes ?? 0) > 0 && !c.revisado ? (
                    <span className="chip-reportes">
                      {c.reportes} {c.reportes === 1 ? "reporte" : "reportes"}
                    </span>
                  ) : null}
                  {c.oculto ? <span className="chip-tipo">Oculto</span> : null}
                </span>
                <span className="texto-item-bandeja">
                  {c.respuestaA ? "↳ " : ""}
                  {c.texto}
                </span>
                <small>En: {c.publicacionTexto || NOMBRE_TIPO[c.publicacionTipo ?? "texto"]}</small>
              </span>
            </button>
          ))}
        </section>

        <section className="detalle-bandeja" aria-label="Comentario abierto" ref={detalle}>
          {!elegido ? (
            <p className="vacio-revisar">Elige un comentario de la lista.</p>
          ) : (
            <>
              <button type="button" className="volver-lista" onClick={() => setElegidoId(null)}>
                <LuArrowLeft aria-hidden /> Volver a la lista
              </button>

              <div className="tarjeta-para-ti contexto-publicacion">
                <span
                  className="mini-contexto"
                  style={
                    elegido.publicacionMiniatura
                      ? { backgroundImage: `url(${urlCompleta(elegido.publicacionMiniatura)})` }
                      : { background: fondoTexto(elegido.publicacionId) }
                  }
                />
                <div>
                  <small>
                    {NOMBRE_TIPO[elegido.publicacionTipo ?? "texto"]} · {miles(elegido.publicacionComentarios ?? 0)} comentarios
                  </small>
                  <b>{elegido.publicacionTexto || "Publicación sin texto"}</b>
                  <Link to={`/para-ti/${elegido.publicacionId}`}>Ver publicación</Link>
                </div>
                <button type="button" className="btn-pildora chico" onClick={alternarComentarios}>
                  {elegido.publicacionPermiteComentarios ? "Cerrar comentarios" : "Abrir comentarios"}
                </button>
              </div>

              <div className="tarjeta-para-ti comentario-abierto">
                <div className="cabeza-comentario">
                  <Avatar c={elegido} grande />
                  <div>
                    <span className="meta-item-bandeja">
                      <b>{elegido.autorNombre}</b>
                      {elegido.oficial ? <Verificado /> : null}
                      {elegido.autorComunidad ? <span>· vecino de {elegido.autorComunidad}</span> : null}
                      <span>· {haceCuanto(elegido.creadoEn)}</span>
                    </span>
                    <p>{elegido.texto}</p>
                    <span className="chips-para-ti">
                      {elegido.respuestaA ? <span className="chip-tipo">Respuesta</span> : null}
                      {fijadoPrincipal ? (
                        <span className="chip-destacada">
                          <LuPin aria-hidden /> Hilo fijado
                        </span>
                      ) : null}
                      {elegido.oculto ? <span className="chip-tipo">Oculto para los vecinos</span> : null}
                      {elegido.silenciadoHasta ? <span className="chip-reportes">Silenciado hasta el {fechaCorta(elegido.silenciadoHasta)}</span> : null}
                      {elegido.corazones ? <span className="chip-tipo">{miles(elegido.corazones)} corazones</span> : null}
                    </span>
                  </div>
                </div>

                {(elegido.reportes ?? 0) > 0 ? (
                  <div className={`caja-reportes ${elegido.revisado ? "revisado" : ""}`}>
                    <b>
                      {elegido.reportes} {elegido.reportes === 1 ? "reporte" : "reportes"}
                    </b>
                    <span>
                      {(elegido.motivos ?? []).map((m) => `«${MOTIVOS_REPORTE[m.motivo]}» (${m.cantidad})`).join(" · ")}
                      {elegido.revisado ? " · ya revisado" : elegido.oculto && (elegido.reportes ?? 0) >= REPORTES_PARA_OCULTAR ? " · oculto automáticamente" : ""}
                    </span>
                  </div>
                ) : null}

                <div className="acciones-comentario">
                  {confirmando ? (
                    <>
                      <span className="confirmar-texto">¿Eliminar para siempre{elegido.respuestaA ? "" : " (con sus respuestas)"}?</span>
                      <button type="button" className="btn-pildora peligro" onClick={borrar}>
                        Sí, eliminar
                      </button>
                      <button type="button" className="btn-pildora" onClick={() => setConfirmando(false)}>
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn-pildora peligro" onClick={() => setConfirmando(true)}>
                        Eliminar comentario
                      </button>
                      {!elegido.oficial ? (
                        reportado ? (
                          <>
                            <button type="button" className="btn-pildora" onClick={() => moderar({ oculto: true, revisado: true }, "Queda oculto")}>
                              {elegido.oculto ? "Mantener oculto" : "Ocultar"}
                            </button>
                            <button type="button" className="btn-pildora" onClick={() => moderar({ oculto: false, revisado: true }, "Comentario visible")}>
                              Está bien, mostrar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn-pildora"
                            onClick={() => moderar({ oculto: !elegido.oculto }, elegido.oculto ? "Comentario visible" : "Comentario oculto")}
                          >
                            {elegido.oculto ? "Mostrar" : "Ocultar"}
                          </button>
                        )
                      ) : null}
                      <button type="button" className="btn-pildora suave" onClick={() => fijar(!fijadoPrincipal)}>
                        <LuPin aria-hidden /> {fijadoPrincipal ? "Desfijar" : "Fijar arriba"}
                      </button>
                      {elegido.usuarioId ? (
                        <button type="button" className="btn-pildora suave" onClick={() => silenciarVecino(elegido.silenciadoHasta ? 0 : 7)}>
                          {elegido.silenciadoHasta ? "Quitar silencio" : "Silenciar a este vecino 7 días"}
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {principal || respuestas.length ? (
                <div className="tarjeta-para-ti hilo-bandeja">
                  <h3>Conversación</h3>
                  {principal && principal.id !== elegido.id ? <ItemHilo c={principal} /> : null}
                  {respuestas.map((r) => (
                    <ItemHilo key={r.id} c={r} respuesta actual={r.id === elegido.id} />
                  ))}
                  {respuestas.length === 0 ? <p className="vacio-revisar">Todavía nadie respondió.</p> : null}
                </div>
              ) : null}

              <div className="tarjeta-para-ti responder-bandeja">
                <label htmlFor="respuesta-elisur" className="titulo-campo">
                  Responder como ELISUR
                </label>
                <textarea
                  id="respuesta-elisur"
                  rows={2}
                  maxLength={500}
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="Tu respuesta aparece con la insignia de cuenta oficial…"
                />
                <div className="botones-responder">
                  <button type="button" className="btn-pildora" disabled={enviando || !respuesta.trim()} onClick={() => enviar(true)}>
                    Responder y fijar
                  </button>
                  <button type="button" className="btn-pildora primario" disabled={enviando || !respuesta.trim()} onClick={() => enviar(false)}>
                    {enviando ? "Enviando…" : "Responder"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ItemHilo({ c, respuesta = false, actual = false }: { c: ComentarioPublicacion; respuesta?: boolean; actual?: boolean }) {
  return (
    <div className={`item-hilo ${respuesta ? "respuesta" : ""} ${actual ? "actual" : ""} ${c.oculto ? "oculto" : ""}`}>
      <Avatar c={c} />
      <div>
        <span className="meta-item-bandeja">
          <b>{c.autorNombre}</b>
          {c.oficial ? <Verificado /> : null}
          <span>· {haceCuanto(c.creadoEn)}</span>
          {c.oculto ? <span className="chip-tipo">Oculto</span> : null}
        </span>
        <p>{c.texto}</p>
      </div>
    </div>
  );
}
