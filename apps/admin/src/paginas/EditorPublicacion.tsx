import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuArrowRight, LuCheck, LuHeart, LuMessageCircle, LuPlay, LuPlus, LuSend, LuUpload, LuX } from "react-icons/lu";
import { DIAS_DESTACADA_MAX, MAX_DESTACADAS, MAX_FOTOS_PUBLICACION, Publicacion, TipoPublicacion, idYoutube } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { avisarErrorParaTi, useParaTi } from "../estado/useParaTi";
import { alertaExito, useToasts } from "../estado/useToasts";
import { urlCompleta } from "../utilidades/media";
import { NOMBRE_TIPO, destacadasEnOrden, estaDestacada, fechaCorta, fechaHora, fondoTexto } from "../utilidades/paraTi";

type Vista = { enlaceUrl: string; titulo: string | null; miniatura: string };
type ModoVista = "muro" | "destacada" | "completa";

const avisar = (titulo: string, detalle?: string) => useToasts.getState().alertar({ tipo: "error", titulo, detalle });

/** "2026-10-10T09:00" para un <input type="datetime-local"> en la hora del navegador. */
function aLocal(fecha: Date): string {
  const d = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

const duracionTexto = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Cuadros del video para elegir portada. Con el archivo recién elegido se lee local; con un video
 * ya subido se pide con CORS (si el almacenamiento no lo permite, solo queda subir una imagen).
 */
async function capturarCuadros(src: string): Promise<{ cuadros: string[]; duracion: number }> {
  const v = document.createElement("video");
  v.crossOrigin = "anonymous";
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = src;
  await new Promise<void>((ok, mal) => {
    v.onloadeddata = () => ok();
    v.onerror = () => mal(new Error("No se pudo leer el video"));
  });
  const duracion = Number.isFinite(v.duration) ? v.duration : 0;
  const lienzo = document.createElement("canvas");
  const ancho = Math.min(v.videoWidth || 720, 1080);
  lienzo.width = ancho;
  lienzo.height = Math.round((ancho * (v.videoHeight || 1280)) / (v.videoWidth || 720));
  const ctx = lienzo.getContext("2d")!;
  const cuadros: string[] = [];
  for (const f of [0.05, 0.3, 0.55, 0.8]) {
    v.currentTime = Math.max(0, Math.min(duracion * f, duracion - 0.1));
    await new Promise<void>((ok) => {
      v.onseeked = () => ok();
    });
    ctx.drawImage(v, 0, 0, lienzo.width, lienzo.height);
    cuadros.push(lienzo.toDataURL("image/jpeg", 0.86));
  }
  return { cuadros, duracion };
}

async function dataUrlAArchivo(dataUrl: string, nombre: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], nombre, { type: "image/jpeg" });
}

/** Crear o editar una publicación de Para ti (decisión 0092): el tipo sale de lo que se sube. */
export function EditorPublicacion() {
  const { id } = useParams<{ id: string }>();
  const esNueva = !id;
  const navegar = useNavigate();
  const token = useSesionAdmin((e) => e.token)!;
  const { publicaciones, cargar, guardar, subirFoto, subirVideo, vistaPreviaYoutube } = useParaTi();
  const existente = publicaciones.find((p) => p.id === id) ?? null;

  const [texto, setTexto] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLocal, setVideoLocal] = useState<string | null>(null);
  const [videoPeso, setVideoPeso] = useState<number | null>(null);
  const [duracion, setDuracion] = useState<number | null>(null);
  const [cuadros, setCuadros] = useState<string[]>([]);
  const [cuadroElegido, setCuadroElegido] = useState<number | null>(null);
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null);
  const [enlace, setEnlace] = useState("");
  const [vista, setVista] = useState<Vista | null>(null);
  const [permiteComentarios, setPermiteComentarios] = useState(false);
  /** null = no cambiar la destacada (solo al editar); 0 = sin destacar; 1–7 días. */
  const [dias, setDias] = useState<number | null>(0);
  const [cuando, setCuando] = useState<"ahora" | "programar">("ahora");
  const [fechaProg, setFechaProg] = useState(() => aLocal(new Date(Date.now() + 864e5)));
  const [modo, setModo] = useState<ModoVista>("muro");
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const cargada = useRef(false);
  const inputArchivos = useRef<HTMLInputElement>(null);
  const inputPortada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (publicaciones.length === 0 || (!esNueva && !existente)) cargar(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esNueva, token]);

  // Al editar, el formulario arranca con lo guardado (una sola vez).
  useEffect(() => {
    if (!existente || cargada.current) return;
    cargada.current = true;
    setTexto(existente.texto);
    setFotos(existente.fotos);
    setVideoUrl(existente.videoUrl);
    setPortadaUrl(existente.portadaUrl);
    if (existente.enlaceUrl) {
      setEnlace(existente.enlaceUrl);
      setVista({ enlaceUrl: existente.enlaceUrl, titulo: existente.enlaceTitulo, miniatura: existente.enlaceMiniatura ?? "" });
    }
    setPermiteComentarios(existente.permiteComentarios);
    setDias(estaDestacada(existente) ? null : 0);
    if (existente.programada && existente.publicadoEn) {
      setCuando("programar");
      setFechaProg(aLocal(new Date(existente.publicadoEn)));
    }
  }, [existente]);

  // Cuadros del video para la portada (y su duración).
  const fuenteVideo = videoLocal ?? urlCompleta(videoUrl) ?? null;
  useEffect(() => {
    if (!fuenteVideo) {
      setCuadros([]);
      setDuracion(null);
      return;
    }
    let vigente = true;
    capturarCuadros(fuenteVideo)
      .then((r) => vigente && (setCuadros(r.cuadros), setDuracion(r.duracion)))
      .catch(() => vigente && setCuadros([]));
    return () => {
      vigente = false;
    };
  }, [fuenteVideo]);

  useEffect(() => () => (videoLocal ? URL.revokeObjectURL(videoLocal) : undefined), [videoLocal]);

  const tipo: TipoPublicacion = fotos.length ? "fotos" : videoUrl ? "video" : vista ? "youtube" : "texto";
  const hayMedia = tipo !== "texto";
  const yaPublicada = existente?.estado === "publicada" && !existente.programada;
  const programar = !yaPublicada && cuando === "programar";
  const otrasDestacadas = useMemo(() => destacadasEnOrden(publicaciones).filter((p) => p.id !== id).length, [publicaciones, id]);
  const libres = Math.max(0, MAX_DESTACADAS - otrasDestacadas);
  const listo = (tipo !== "texto" || texto.trim() !== "") && (!programar || Boolean(fechaProg));

  // ---------- Contenido: se detecta el tipo ----------

  async function recibirArchivos(lista: File[]) {
    if (!lista.length) return;
    const imagenes = lista.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    const videos = lista.filter((f) => f.type.startsWith("video/"));
    if (imagenes.length && videos.length) return avisar("Sube fotos o un video, no ambos a la vez");
    if (!imagenes.length && !videos.length) return avisar("Ese archivo no sirve", "Fotos JPG, PNG o WEBP, o un video.");
    if (videos.length) {
      if (fotos.length || vista) return avisar("Ya hay contenido", "Quita lo que subiste para poner un video.");
      return elegirVideo(videos[0]);
    }
    if (videoUrl || vista) return avisar("Ya hay contenido", "Quita el video o el enlace para poner fotos.");
    const lugar = MAX_FOTOS_PUBLICACION - fotos.length;
    if (lugar <= 0) return avisar(`Hasta ${MAX_FOTOS_PUBLICACION} fotos por publicación`);
    const tanda = imagenes.slice(0, lugar);
    for (const [i, archivo] of tanda.entries()) {
      setSubiendo(`Subiendo foto ${i + 1} de ${tanda.length}…`);
      const url = await subirFoto(archivo, token);
      if (url) setFotos((f) => [...f, url]);
      else avisarErrorParaTi("No se pudo subir una foto");
    }
    setSubiendo(null);
  }

  async function elegirVideo(archivo: File) {
    setSubiendo(`Subiendo video (${(archivo.size / 1024 / 1024).toFixed(1)} MB)…`);
    setProgreso(0);
    const local = URL.createObjectURL(archivo);
    const url = await subirVideo(archivo, token, setProgreso);
    if (url) {
      setVideoUrl(url);
      setVideoLocal(local);
      setVideoPeso(archivo.size);
      setPortadaUrl(null);
      setCuadroElegido(null);
    } else {
      URL.revokeObjectURL(local);
      avisarErrorParaTi("No se pudo subir el video");
    }
    setSubiendo(null);
  }

  async function leerEnlace(valor = enlace) {
    const limpio = valor.trim();
    if (!limpio || subiendo) return;
    if (!idYoutube(limpio)) return avisar("Ese enlace no es de YouTube", "Pega un enlace de un video de YouTube.");
    if (fotos.length || videoUrl) return avisar("Ya hay contenido", "Quita lo que subiste para poner un enlace.");
    setSubiendo("Leyendo el enlace…");
    const v = await vistaPreviaYoutube(limpio, token);
    setVista(v);
    if (!v) avisarErrorParaTi("No se pudo leer el enlace");
    setSubiendo(null);
  }

  function soltar(e: DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    const archivos = Array.from(e.dataTransfer.files);
    if (archivos.length) return recibirArchivos(archivos);
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (url) {
      setEnlace(url);
      leerEnlace(url);
    }
  }

  function quitarContenido() {
    setFotos([]);
    setVideoUrl(null);
    setVideoLocal(null);
    setPortadaUrl(null);
    setCuadroElegido(null);
    setVista(null);
    setEnlace("");
  }

  async function elegirCuadro(i: number) {
    setSubiendo("Guardando portada…");
    const url = await subirFoto(await dataUrlAArchivo(cuadros[i], "portada.jpg"), token);
    if (url) {
      setPortadaUrl(url);
      setCuadroElegido(i);
    } else avisarErrorParaTi("No se pudo guardar la portada");
    setSubiendo(null);
  }

  async function subirPortada(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo("Subiendo portada…");
    const url = await subirFoto(archivo, token);
    if (url) {
      setPortadaUrl(url);
      setCuadroElegido(null);
    } else avisarErrorParaTi("No se pudo subir la portada");
    setSubiendo(null);
  }

  const mover = (i: number, d: -1 | 1) =>
    setFotos((f) => {
      const n = [...f];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });

  // ---------- Guardar ----------

  async function enviar(estado: Publicacion["estado"]) {
    const fecha = programar ? new Date(fechaProg) : null;
    if (estado === "publicada" && fecha && fecha.getTime() < Date.now() + 60_000) return avisar("La fecha tiene que ser en el futuro");
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
        ...(dias === null ? {} : { diasDestacada: dias }),
        ...(estado === "publicada" ? { programadaPara: fecha ? fecha.toISOString() : existente?.programada ? null : undefined } : {}),
      },
      token,
    );
    setGuardando(false);
    if (!p) return avisarErrorParaTi("No se pudo guardar");
    alertaExito(
      estado === "borrador"
        ? "Borrador guardado"
        : p.programada
          ? `Programada para el ${fechaHora(p.publicadoEn!)}`
          : yaPublicada
            ? "Cambios guardados"
            : "Publicado en Para ti",
    );
    navegar("/para-ti/publicaciones");
  }

  if (!esNueva && !existente) return <p className="vacio-editor">Cargando publicación…</p>;

  const estadoTexto = !existente
    ? "Nueva"
    : existente.estado === "borrador"
      ? "Borrador"
      : existente.programada
        ? `Programada para el ${fechaHora(existente.publicadoEn!)}`
        : `Publicada el ${fechaCorta(existente.publicadoEn!)}`;
  const textoPrincipal = guardando ? "Guardando…" : yaPublicada ? "Guardar cambios" : programar ? "Programar" : "Publicar ahora";
  const opcionesDias = [...(existente && estaDestacada(existente) ? [null] : []), 0, ...Array.from({ length: DIAS_DESTACADA_MAX }, (_, i) => i + 1)];

  return (
    <div className="compositor">
      <div className="cabecera-compositor">
        <Link to="/para-ti" className="volver-redondo" aria-label="Volver a Para ti">
          <LuArrowLeft />
        </Link>
        <h2>{esNueva ? "Crear publicación" : "Editar publicación"}</h2>
        <span className="estado-compositor">{estadoTexto}</span>
        <div className="botones-compositor">
          <button type="button" className="btn-pildora" disabled={guardando || Boolean(subiendo) || !listo} onClick={() => enviar("borrador")}>
            {yaPublicada || existente?.programada ? "Pasar a borrador" : "Guardar borrador"}
          </button>
          <button type="button" className="btn-pildora primario" disabled={guardando || Boolean(subiendo) || !listo} onClick={() => enviar("publicada")}>
            {textoPrincipal}
          </button>
        </div>
      </div>

      <div className="cuerpo-compositor">
        <div className="columna-compositor">
          <section className="tarjeta-para-ti" aria-label="Contenido">
            <div className="titulo-tarjeta-para-ti">
              <h3>Contenido</h3>
              <span className="chip-detectado">
                <LuCheck aria-hidden /> {hayMedia ? `Detectado: ${NOMBRE_TIPO[tipo].toLowerCase()}` : "Solo texto"}
              </span>
            </div>

            <input
              ref={inputArchivos}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/*"
              multiple
              hidden
              onChange={(e) => {
                recibirArchivos(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            <input ref={inputPortada} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { subirPortada(e.target.files?.[0]); e.target.value = ""; }} />

            {tipo === "fotos" ? (
              <div className="fotos-compositor">
                {fotos.map((f, i) => (
                  <div className="foto-compositor" key={f} style={{ backgroundImage: `url(${urlCompleta(f)})` }}>
                    {i === 0 ? <span className="chip-portada">Portada</span> : null}
                    <div className="acciones-foto-publicacion">
                      <button type="button" aria-label="Mover a la izquierda" disabled={i === 0} onClick={() => mover(i, -1)}><LuArrowLeft /></button>
                      <button type="button" aria-label="Quitar foto" onClick={() => setFotos((l) => l.filter((x) => x !== f))}><LuX /></button>
                      <button type="button" aria-label="Mover a la derecha" disabled={i === fotos.length - 1} onClick={() => mover(i, 1)}><LuArrowRight /></button>
                    </div>
                  </div>
                ))}
                {fotos.length < MAX_FOTOS_PUBLICACION ? (
                  <button type="button" className="agregar-foto-compositor" disabled={Boolean(subiendo)} onClick={() => inputArchivos.current?.click()}>
                    <LuPlus aria-hidden /> Agregar
                  </button>
                ) : null}
              </div>
            ) : null}

            {tipo === "video" ? (
              <div className="video-compositor">
                <div className="caja-video-compositor">
                  <video src={fuenteVideo ?? undefined} poster={urlCompleta(portadaUrl) ?? undefined} controls playsInline preload="metadata" />
                  <span className="chip-video">
                    Video{videoPeso ? ` · ${(videoPeso / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : ""}
                    {duracion ? ` · ${duracionTexto(duracion)}` : ""}
                  </span>
                </div>
                <div className="portada-compositor">
                  <b>Portada</b>
                  <span>Elige un cuadro del video o sube una imagen. Sin portada se usa el primer cuadro.</span>
                  <div className="cuadros-compositor">
                    {cuadros.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Usar el cuadro ${i + 1} como portada`}
                        aria-pressed={cuadroElegido === i}
                        className={cuadroElegido === i ? "elegido" : ""}
                        style={{ backgroundImage: `url(${c})` }}
                        disabled={Boolean(subiendo)}
                        onClick={() => elegirCuadro(i)}
                      />
                    ))}
                    {portadaUrl && cuadroElegido === null ? (
                      <span className="cuadro-subido elegido" style={{ backgroundImage: `url(${urlCompleta(portadaUrl)})` }} aria-label="Portada subida" />
                    ) : null}
                    <button type="button" className="cuadro-subir" aria-label="Subir imagen de portada" disabled={Boolean(subiendo)} onClick={() => inputPortada.current?.click()}>
                      <LuUpload aria-hidden />
                    </button>
                  </div>
                  {portadaUrl ? (
                    <button type="button" className="enlace-boton" onClick={() => { setPortadaUrl(null); setCuadroElegido(null); }}>
                      Quitar portada
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {tipo === "youtube" && vista ? (
              <div className="vista-yt">
                <div className="mini-yt" style={{ backgroundImage: `url(${vista.miniatura})` }}>
                  <span aria-hidden><LuPlay /></span>
                </div>
                <div>
                  <span className="ok-yt">Vista previa encontrada</span>
                  <b>{vista.titulo ?? "Video de YouTube"}</b>
                  <span>youtube.com · el título y la miniatura se toman solos del enlace</span>
                </div>
              </div>
            ) : null}

            {subiendo?.startsWith("Subiendo video") ? (
              <div className="progreso-video" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${progreso}%` }} />
                <span>{progreso}%</span>
              </div>
            ) : null}

            {hayMedia ? (
              <div className="botones-video">
                {tipo === "video" ? (
                  <button type="button" className="btn-pildora chico" disabled={Boolean(subiendo)} onClick={() => inputArchivos.current?.click()}>
                    Cambiar video
                  </button>
                ) : null}
                <button type="button" className="btn-pildora chico peligro-texto" disabled={Boolean(subiendo)} onClick={quitarContenido}>
                  Quitar {tipo === "fotos" ? "las fotos" : tipo === "video" ? "el video" : "el enlace"}
                </button>
              </div>
            ) : (
              <div
                className={`zona-soltar ${arrastrando ? "encima" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastrando(true);
                }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={soltar}
              >
                <LuUpload aria-hidden className="icono-soltar" />
                <div>
                  <b>Arrastra aquí fotos o un video, o pega un enlace de YouTube</b>
                  <span>El tipo se detecta solo. Hasta {MAX_FOTOS_PUBLICACION} fotos; videos sin límite de duración. Sin nada, es una publicación de solo texto.</span>
                </div>
                <div className="acciones-soltar">
                  <button type="button" className="btn-pildora" disabled={Boolean(subiendo)} onClick={() => inputArchivos.current?.click()}>
                    Elegir archivos
                  </button>
                  <label className="solo-lector" htmlFor="pegar-enlace">
                    Pegar enlace de YouTube
                  </label>
                  <input
                    id="pegar-enlace"
                    value={enlace}
                    placeholder="Pegar enlace de YouTube…"
                    onChange={(e) => setEnlace(e.target.value)}
                    onPaste={(e) => {
                      const valor = e.clipboardData.getData("text");
                      if (valor) {
                        e.preventDefault();
                        setEnlace(valor);
                        leerEnlace(valor);
                      }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), leerEnlace())}
                    onBlur={() => enlace.trim() && leerEnlace()}
                  />
                </div>
              </div>
            )}
            {subiendo && !subiendo.startsWith("Subiendo video") ? <p className="ayuda-modal">{subiendo}</p> : null}
          </section>

          <section className="tarjeta-para-ti" aria-label="Texto">
            <label htmlFor="texto-publicacion" className="titulo-campo">
              {tipo === "texto" ? "Texto" : "Texto (opcional)"}
            </label>
            <textarea id="texto-publicacion" rows={4} maxLength={2000} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="¿Qué quieres contar?" />
            <div className="pie-texto">
              <span>Las primeras 2 líneas se ven en el muro; el resto con «más».</span>
              <span>{texto.length} / 2000</span>
            </div>
          </section>

          <section className="tarjeta-para-ti opciones-compositor" aria-label="Opciones">
            <div className="opcion-compositor">
              <div>
                <b>Destacar arriba</b>
                <span>
                  {dias === null && existente?.destacadaHasta
                    ? `Destacada hasta el ${fechaHora(existente.destacadaHasta)}.`
                    : `Quedan ${libres} de ${MAX_DESTACADAS} lugares libres. Los días cuentan desde que sale.`}
                </span>
              </div>
              <div className="segmentos" role="radiogroup" aria-label="Días destacada">
                {opcionesDias.map((d) => (
                  <button key={String(d)} type="button" role="radio" aria-checked={dias === d} className={dias === d ? "activo" : ""} onClick={() => setDias(d)}>
                    {d === null ? "Igual" : d === 0 ? "No" : `${d} d`}
                  </button>
                ))}
              </div>
            </div>
            {dias && libres === 0 ? <p className="nota-alerta">Ya hay {MAX_DESTACADAS} destacadas: en la app se ven las 10 primeras del orden.</p> : null}
            <div className="opcion-compositor">
              <div>
                <b>Permitir comentarios</b>
                <span>Solo vecinos con cuenta. Puedes responder y fijar un comentario desde Comentarios.</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={permiteComentarios}
                aria-label="Permitir comentarios"
                className={`interruptor grande ${permiteComentarios ? "encendido" : ""}`}
                onClick={() => setPermiteComentarios((v) => !v)}
              >
                <i />
              </button>
            </div>
            {!yaPublicada ? (
              <div className="opcion-compositor">
                <div>
                  <b>Cuándo sale</b>
                  <span>Prográmala y se publica sola a esa hora.</span>
                </div>
                <div className="cuando-compositor">
                  <div className="segmentos" role="radiogroup" aria-label="Cuándo sale">
                    <button type="button" role="radio" aria-checked={cuando === "ahora"} className={cuando === "ahora" ? "activo" : ""} onClick={() => setCuando("ahora")}>
                      Ahora
                    </button>
                    <button type="button" role="radio" aria-checked={cuando === "programar"} className={cuando === "programar" ? "activo" : ""} onClick={() => setCuando("programar")}>
                      Programar
                    </button>
                  </div>
                  {cuando === "programar" ? (
                    <input
                      type="datetime-local"
                      aria-label="Fecha y hora en que sale"
                      value={fechaProg}
                      min={aLocal(new Date(Date.now() + 5 * 60000))}
                      onChange={(e) => setFechaProg(e.target.value)}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="vista-compositor" aria-label="Vista previa">
          <div className="segmentos" role="tablist" aria-label="Dónde se ve">
            {(["muro", "destacada", "completa"] as ModoVista[]).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={modo === m} className={modo === m ? "activo" : ""} onClick={() => setModo(m)}>
                {m === "muro" ? "En el muro" : m === "destacada" ? "Destacada" : "Pantalla completa"}
              </button>
            ))}
          </div>
          <VistaPrevia
            modo={modo}
            idPub={id ?? "nueva"}
            tipo={tipo}
            texto={texto}
            imagen={tipo === "fotos" ? urlCompleta(fotos[0]) ?? null : tipo === "video" ? urlCompleta(portadaUrl) ?? null : tipo === "youtube" ? vista?.miniatura ?? null : null}
            video={tipo === "video" && !portadaUrl ? fuenteVideo : null}
            cantidadFotos={fotos.length}
            cuando={programar ? fechaHora(new Date(fechaProg).toISOString()) : "Ahora"}
            permiteComentarios={permiteComentarios}
            tituloYoutube={vista?.titulo ?? null}
          />
          <span className="alcance-vista">Se ve en todos los distritos. El autor que ven los vecinos es «ELISUR».</span>
        </aside>
      </div>
    </div>
  );
}

function Verificado() {
  return (
    <svg className="verificado" width="13" height="13" viewBox="0 0 24 24" role="img" aria-label="Cuenta oficial">
      <circle cx="12" cy="12" r="10" fill="#1a531a" />
      <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Cómo se verá en la app: en el muro, como destacada (historia) o a pantalla completa. */
function VistaPrevia(props: {
  modo: ModoVista;
  idPub: string;
  tipo: TipoPublicacion;
  texto: string;
  imagen: string | null;
  video: string | null;
  cantidadFotos: number;
  cuando: string;
  permiteComentarios: boolean;
  tituloYoutube: string | null;
}) {
  const { modo, tipo, texto, imagen, video } = props;
  const fondo = imagen ? (
    <span className="vp2-imagen" style={{ backgroundImage: `url(${imagen})` }} />
  ) : video ? (
    <video className="vp2-imagen" src={`${video}#t=0.1`} muted playsInline preload="metadata" />
  ) : (
    <span className="vp2-imagen" style={{ background: fondoTexto(props.idPub) }} />
  );
  const esVideo = tipo === "video" || tipo === "youtube";
  const titulo = texto.trim() || props.tituloYoutube || "Tu publicación";

  if (modo === "destacada") {
    const palabras = titulo.split(/\s+/).slice(0, 8);
    const lineas = [palabras.slice(0, 4).join(" "), palabras.slice(4, 8).join(" ")].filter(Boolean);
    return (
      <div className="vp2-telefono oscuro">
        <div className="vp2-historia">
          {fondo}
          <span className="vp2-velo-arriba" />
          <span className="vp2-progreso">
            <i className="lleno" />
            <i />
            <i />
          </span>
          <span className="vp2-autor-historia">
            <span className="vp2-avatar">EL</span> ELISUR <small>· {props.cuando}</small>
          </span>
          <span className="vp2-etiquetas">
            {lineas.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </span>
          <span className="vp2-pie-historia">
            <span>Ver publicación completa</span>
            <LuHeart aria-hidden />
            <LuSend aria-hidden />
          </span>
        </div>
      </div>
    );
  }

  if (modo === "completa") {
    return (
      <div className="vp2-telefono oscuro">
        <div className="vp2-completa">
          {tipo === "texto" ? <span className="vp2-imagen" style={{ background: fondoTexto(props.idPub) }} /> : fondo}
          <span className="vp2-velo-abajo" />
          {esVideo ? (
            <span className="vp2-play grande" aria-hidden>
              <LuPlay />
            </span>
          ) : null}
          <span className="vp2-riel" aria-hidden>
            <span className="vp2-avatar borde">EL</span>
            <span>
              <LuHeart />0
            </span>
            {props.permiteComentarios ? (
              <span>
                <LuMessageCircle />0
              </span>
            ) : null}
            <span>
              <LuSend />0
            </span>
          </span>
          <span className="vp2-texto-completa">
            <b>
              ELISUR <Verificado />
            </b>
            <span>{texto.trim() || props.tituloYoutube || ""}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="vp2-telefono">
      <div className="vp2-muro">
        <span className="vp2-autor">
          <span className="vp2-avatar">EL</span>
          <b>
            ELISUR <Verificado />
          </b>
          <small>· {props.cuando}</small>
        </span>
        {tipo !== "texto" ? (
          <span className={`vp2-media ${tipo === "youtube" ? "ancho" : ""}`}>
            {fondo}
            {esVideo ? (
              <span className={`vp2-play ${tipo === "youtube" ? "yt" : ""}`} aria-hidden>
                <LuPlay />
              </span>
            ) : null}
            {tipo === "fotos" && props.cantidadFotos > 1 ? <em>1/{props.cantidadFotos}</em> : null}
          </span>
        ) : null}
        {tipo === "youtube" && props.tituloYoutube ? <span className="vp2-yt">youtube.com · {props.tituloYoutube}</span> : null}
        <span className="vp2-acciones" aria-hidden>
          <LuHeart />
          {props.permiteComentarios ? <LuMessageCircle /> : null}
          <LuSend />
        </span>
        {texto.trim() ? (
          <p className="vp2-pie">
            <b>ELISUR</b> {texto}
          </p>
        ) : null}
        {props.permiteComentarios ? <span className="vp2-ver-com">Sé el primero en comentar</span> : <span className="vp2-ver-com">Comentarios cerrados</span>}
      </div>
    </div>
  );
}
