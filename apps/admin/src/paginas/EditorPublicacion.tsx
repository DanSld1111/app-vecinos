import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuArrowRight, LuPlay, LuUpload, LuX } from "react-icons/lu";
import { DIAS_DESTACADA_MAX, MAX_FOTOS_PUBLICACION, Publicacion, TipoPublicacion } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { avisarErrorParaTi, useParaTi } from "../estado/useParaTi";
import { alertaExito } from "../estado/useToasts";
import { urlCompleta } from "../utilidades/media";
import { estaDestacada } from "./ParaTiPublicaciones";

const TIPOS: { id: TipoPublicacion; texto: string }[] = [
  { id: "fotos", texto: "Fotos" },
  { id: "video", texto: "Subir video" },
  { id: "youtube", texto: "Enlace de YouTube" },
  { id: "texto", texto: "Solo texto" },
];

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" });

/** Crear o editar una publicación de Para ti (decisión 0091). */
export function EditorPublicacion() {
  const { id } = useParams<{ id: string }>();
  const esNueva = !id;
  const navegar = useNavigate();
  const token = useSesionAdmin((e) => e.token)!;
  const { publicaciones, cargar, guardar, subirFoto, subirVideo, vistaPreviaYoutube } = useParaTi();
  const existente = publicaciones.find((p) => p.id === id) ?? null;

  const [tipo, setTipo] = useState<TipoPublicacion>("fotos");
  const [texto, setTexto] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null);
  const [enlace, setEnlace] = useState("");
  const [vista, setVista] = useState<{ enlaceUrl: string; titulo: string | null; miniatura: string } | null>(null);
  const [permiteComentarios, setPermiteComentarios] = useState(false);
  const [destacar, setDestacar] = useState(false);
  const [dias, setDias] = useState(3);
  const [cambioDestacada, setCambioDestacada] = useState(false);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const cargada = useRef(false);
  const inputFotos = useRef<HTMLInputElement>(null);
  const inputVideo = useRef<HTMLInputElement>(null);
  const inputPortada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!esNueva && !existente) cargar(token);
  }, [esNueva, existente, cargar, token]);

  // Al editar, el formulario arranca con lo guardado (una sola vez).
  useEffect(() => {
    if (!existente || cargada.current) return;
    cargada.current = true;
    setTipo(existente.tipo);
    setTexto(existente.texto);
    setFotos(existente.fotos);
    setVideoUrl(existente.videoUrl);
    setPortadaUrl(existente.portadaUrl);
    setEnlace(existente.enlaceUrl ?? "");
    if (existente.enlaceUrl) setVista({ enlaceUrl: existente.enlaceUrl, titulo: existente.enlaceTitulo, miniatura: existente.enlaceMiniatura ?? "" });
    setPermiteComentarios(existente.permiteComentarios);
    setDestacar(estaDestacada(existente));
  }, [existente]);

  async function agregarFotos(archivos: FileList | null) {
    if (!archivos) return;
    const lugar = MAX_FOTOS_PUBLICACION - fotos.length;
    const lista = Array.from(archivos).slice(0, lugar);
    for (const [i, archivo] of lista.entries()) {
      setSubiendo(`Subiendo foto ${i + 1} de ${lista.length}…`);
      const url = await subirFoto(archivo, token);
      if (url) setFotos((f) => [...f, url]);
      else avisarErrorParaTi("No se pudo subir una foto");
    }
    setSubiendo(null);
  }

  async function elegirVideo(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(`Subiendo video (${(archivo.size / 1024 / 1024).toFixed(1)} MB)…`);
    setProgreso(0);
    const url = await subirVideo(archivo, token, setProgreso);
    if (url) setVideoUrl(url);
    else avisarErrorParaTi("No se pudo subir el video");
    setSubiendo(null);
  }

  async function elegirPortada(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo("Subiendo portada…");
    const url = await subirFoto(archivo, token);
    if (url) setPortadaUrl(url);
    else avisarErrorParaTi("No se pudo subir la portada");
    setSubiendo(null);
  }

  async function buscarVistaPrevia() {
    // Ya hay vista previa de este enlace (cambiarlo la borra), o se está pidiendo.
    if (!enlace.trim() || vista || subiendo) return;
    setSubiendo("Leyendo el enlace…");
    const v = await vistaPreviaYoutube(enlace.trim(), token);
    setVista(v);
    if (!v) avisarErrorParaTi("No se pudo leer el enlace");
    setSubiendo(null);
  }

  const mover = (i: number, d: -1 | 1) =>
    setFotos((f) => {
      const n = [...f];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });

  const listo =
    tipo === "texto" ? texto.trim() !== "" : tipo === "fotos" ? fotos.length > 0 : tipo === "video" ? Boolean(videoUrl) : Boolean(vista);

  async function enviar(estado: Publicacion["estado"]) {
    setGuardando(true);
    const p = await guardar(
      id ?? null,
      {
        tipo,
        texto,
        fotos: tipo === "fotos" ? fotos : [],
        videoUrl: tipo === "video" ? videoUrl : null,
        portadaUrl: tipo === "video" ? portadaUrl : null,
        enlaceUrl: tipo === "youtube" ? vista?.enlaceUrl ?? enlace : null,
        estado,
        permiteComentarios,
        // En una nueva siempre se manda; al editar, solo si se tocó el interruptor o los días.
        ...(esNueva || cambioDestacada ? { diasDestacada: destacar ? dias : 0 } : {}),
      },
      token,
    );
    setGuardando(false);
    if (!p) return avisarErrorParaTi("No se pudo guardar");
    alertaExito(estado === "publicada" ? (existente?.estado === "publicada" ? "Cambios guardados" : "Publicado en Para ti") : "Borrador guardado");
    navegar("/para-ti");
  }

  if (!esNueva && !existente) return <p className="vacio-editor">Cargando publicación…</p>;

  const miniaturaVista = tipo === "fotos" ? urlCompleta(fotos[0]) : tipo === "video" ? urlCompleta(portadaUrl) : tipo === "youtube" ? vista?.miniatura : null;

  return (
    <div className="editor-publicacion">
      <div className="form-publicacion">
        <Link to="/para-ti" className="volver-para-ti">
          ← Para ti
        </Link>
        <h2>{esNueva ? "Nueva publicación" : "Editar publicación"}</h2>

        <div className="campo-modal">
          <label>Qué vas a publicar</label>
          <div className="tipos-publicacion" role="radiogroup" aria-label="Tipo de publicación">
            {TIPOS.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={tipo === t.id} className={tipo === t.id ? "activo" : ""} onClick={() => setTipo(t.id)}>
                {t.texto}
              </button>
            ))}
          </div>
        </div>

        {tipo === "fotos" ? (
          <div className="campo-modal">
            <label>
              Fotos <small>· hasta {MAX_FOTOS_PUBLICACION}; la primera es la portada</small>
            </label>
            <input ref={inputFotos} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { agregarFotos(e.target.files); e.target.value = ""; }} />
            <div className="fotos-publicacion">
              {fotos.map((f, i) => (
                <div className="foto-publicacion" key={f} style={{ backgroundImage: `url(${urlCompleta(f)})` }}>
                  <div className="acciones-foto-publicacion">
                    <button type="button" aria-label="Mover a la izquierda" disabled={i === 0} onClick={() => mover(i, -1)}><LuArrowLeft /></button>
                    <button type="button" aria-label="Quitar foto" onClick={() => setFotos((l) => l.filter((x) => x !== f))}><LuX /></button>
                    <button type="button" aria-label="Mover a la derecha" disabled={i === fotos.length - 1} onClick={() => mover(i, 1)}><LuArrowRight /></button>
                  </div>
                </div>
              ))}
              {fotos.length < MAX_FOTOS_PUBLICACION ? (
                <button type="button" className="agregar-foto-publicacion" disabled={Boolean(subiendo)} onClick={() => inputFotos.current?.click()}>
                  <LuUpload aria-hidden /> Agregar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {tipo === "video" ? (
          <div className="campo-modal">
            <label>Video</label>
            <input ref={inputVideo} type="file" accept="video/*" hidden onChange={(e) => { elegirVideo(e.target.files?.[0]); e.target.value = ""; }} />
            <input ref={inputPortada} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { elegirPortada(e.target.files?.[0]); e.target.value = ""; }} />
            {videoUrl ? (
              <video className="video-publicacion" src={urlCompleta(videoUrl)} poster={urlCompleta(portadaUrl) ?? undefined} controls preload="metadata" />
            ) : null}
            {subiendo?.startsWith("Subiendo video") ? (
              <div className="progreso-video" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${progreso}%` }} />
                <span>{progreso}%</span>
              </div>
            ) : null}
            <div className="botones-video">
              <button type="button" className="btn-accion-mini" disabled={Boolean(subiendo)} onClick={() => inputVideo.current?.click()}>
                <LuUpload aria-hidden /> {videoUrl ? "Cambiar video" : "Elegir video"}
              </button>
              <button type="button" className="btn-accion-mini" disabled={Boolean(subiendo)} onClick={() => inputPortada.current?.click()}>
                {portadaUrl ? "Cambiar portada" : "Agregar portada (opcional)"}
              </button>
              {portadaUrl ? (
                <button type="button" className="btn-accion-mini" onClick={() => setPortadaUrl(null)}>
                  Quitar portada
                </button>
              ) : null}
            </div>
            <p className="ayuda-modal">Sin límite de duración. El tamaño máximo lo pone el plan de almacenamiento; si un video es muy pesado, súbelo a YouTube y pega el enlace.</p>
          </div>
        ) : null}

        {tipo === "youtube" ? (
          <div className="campo-modal">
            <label htmlFor="enlace-yt">Enlace del video</label>
            <div className="fila-enlace-yt">
              <input id="enlace-yt" value={enlace} onChange={(e) => { setEnlace(e.target.value); setVista(null); }} onBlur={buscarVistaPrevia} placeholder="https://www.youtube.com/watch?v=…" />
              <button type="button" className="btn-accion-mini" disabled={!enlace.trim() || Boolean(subiendo)} onClick={buscarVistaPrevia}>
                Ver vista previa
              </button>
            </div>
            {vista ? (
              <div className="vista-yt">
                <div className="mini-yt" style={{ backgroundImage: `url(${vista.miniatura})` }}>
                  <span aria-hidden><LuPlay /></span>
                </div>
                <div>
                  <span className="ok-yt">Vista previa encontrada</span>
                  <b>{vista.titulo ?? "Video de YouTube"}</b>
                  <span>youtube.com</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="campo-modal">
          <label htmlFor="texto-publicacion">{tipo === "texto" ? "Texto" : "Texto (opcional)"}</label>
          <textarea id="texto-publicacion" rows={4} maxLength={2000} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="¿Qué quieres contar?" />
        </div>

        <div className="opciones-publicacion">
          <div className="opcion-publicacion">
            <div>
              <b>Destacar arriba en Para ti</b>
              <span>
                {existente && estaDestacada(existente) && !cambioDestacada
                  ? `Destacada hasta el ${fecha(existente.destacadaHasta!)}.`
                  : "Aparece en los rectángulos de arriba y se quita sola al cumplir los días."}
              </span>
            </div>
            {destacar ? (
              <select
                aria-label="Días destacada"
                value={dias}
                onChange={(e) => {
                  setDias(Number(e.target.value));
                  setCambioDestacada(true);
                }}
              >
                {Array.from({ length: DIAS_DESTACADA_MAX }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d === 1 ? "1 día" : `${d} días`}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              role="switch"
              aria-checked={destacar}
              aria-label="Destacar arriba en Para ti"
              className={`interruptor ${destacar ? "encendido" : ""}`}
              onClick={() => {
                setDestacar((d) => !d);
                setCambioDestacada(true);
              }}
            >
              <i />
            </button>
          </div>
          <div className="opcion-publicacion">
            <div>
              <b>Permitir comentarios</b>
              <span>Encendido: los vecinos con cuenta comentan al instante. Apagado: solo corazón y compartir.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={permiteComentarios}
              aria-label="Permitir comentarios"
              className={`interruptor ${permiteComentarios ? "encendido" : ""}`}
              onClick={() => setPermiteComentarios((v) => !v)}
            >
              <i />
            </button>
          </div>
          <p className="alcance-publicacion">
            <b>Se ve en todos los distritos.</b> Para ti no se separa por comunidad. El autor que ven los vecinos es «ELISUR».
          </p>
        </div>

        {subiendo && !subiendo.startsWith("Subiendo video") ? <p className="ayuda-modal">{subiendo}</p> : null}

        <div className="botones-publicacion">
          <button type="button" className="btn-cancelar" disabled={guardando || Boolean(subiendo) || !listo} onClick={() => enviar("borrador")}>
            {existente?.estado === "publicada" ? "Pasar a borrador" : "Guardar borrador"}
          </button>
          <button type="button" className="btn-crear" disabled={guardando || Boolean(subiendo) || !listo} onClick={() => enviar("publicada")}>
            {guardando ? "Guardando…" : existente?.estado === "publicada" ? "Guardar cambios" : "Publicar ahora"}
          </button>
        </div>
      </div>

      <aside className="vista-publicacion" aria-label="Vista previa">
        <span className="rotulo-telefono">Así lo verán en la app</span>
        <div className="tf-telefono">
          <div className="tf-pantalla">
            <div className="vp-para-ti">
              <div className="vp-autor">
                <span>EL</span>
                <div>
                  <b>ELISUR</b>
                  <small>Ahora{destacar ? " · destacada" : ""}</small>
                </div>
              </div>
              {texto ? <p>{texto}</p> : null}
              {miniaturaVista ? (
                <div className="vp-media" style={{ backgroundImage: `url(${miniaturaVista})` }}>
                  {tipo === "video" || tipo === "youtube" ? <span aria-hidden><LuPlay /></span> : null}
                  {tipo === "fotos" && fotos.length > 1 ? <em>1/{fotos.length}</em> : null}
                </div>
              ) : tipo === "video" && videoUrl ? (
                <div className="vp-media vacia"><span aria-hidden><LuPlay /></span></div>
              ) : null}
              {tipo === "youtube" && vista ? <small className="vp-yt">youtube.com · {vista.titulo ?? ""}</small> : null}
              <div className="vp-acciones">
                <span>♡ 0</span>
                {permiteComentarios ? <span>Comentar</span> : null}
                <span>Compartir</span>
                {!permiteComentarios ? <span className="vp-cerrados">Comentarios cerrados</span> : null}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
