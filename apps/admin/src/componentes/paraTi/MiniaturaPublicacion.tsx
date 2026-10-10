import { LuFileText, LuImage, LuPlay, LuYoutube } from "react-icons/lu";
import { Publicacion } from "@app-vecinos/tipos";
import { urlCompleta } from "../../utilidades/media";
import { fondoTexto, miniaturaDe } from "../../utilidades/paraTi";

const ICONO = { fotos: LuImage, video: LuPlay, youtube: LuYoutube, texto: LuFileText };

/**
 * La imagen de una publicación ocupando su caja: foto, portada, miniatura de YouTube, el primer
 * cuadro del video si no tiene portada, o un fondo de color con el texto si es solo texto.
 */
export function MiniaturaPublicacion({ p, conTexto = false }: { p: Publicacion; conTexto?: boolean }) {
  const imagen = miniaturaDe(p);
  const Icono = ICONO[p.tipo];
  if (imagen) return <span className="miniatura-pub" style={{ backgroundImage: `url(${imagen})` }} aria-hidden />;
  if (p.tipo === "video" && p.videoUrl) {
    return (
      <span className="miniatura-pub" aria-hidden>
        <video src={`${urlCompleta(p.videoUrl)}#t=0.1`} muted playsInline preload="metadata" />
      </span>
    );
  }
  return (
    <span className="miniatura-pub texto" style={{ background: fondoTexto(p.id) }} aria-hidden>
      {conTexto && p.texto ? <span className="miniatura-pub-texto">{p.texto}</span> : <Icono />}
    </span>
  );
}
