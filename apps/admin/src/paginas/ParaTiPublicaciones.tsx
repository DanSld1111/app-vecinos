import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuFileText, LuHeart, LuImage, LuMessageSquare, LuPencil, LuPlay, LuShare2, LuTrash2, LuYoutube } from "react-icons/lu";
import { Publicacion } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { avisarErrorParaTi, useParaTi } from "../estado/useParaTi";
import { alertaExito } from "../estado/useToasts";
import { urlCompleta } from "../utilidades/media";

type Filtro = "todas" | "publicadas" | "destacadas" | "borradores";

const TIPO: Record<Publicacion["tipo"], { texto: string; icono: typeof LuImage }> = {
  fotos: { texto: "Fotos", icono: LuImage },
  video: { texto: "Video", icono: LuPlay },
  youtube: { texto: "YouTube", icono: LuYoutube },
  texto: { texto: "Texto", icono: LuFileText },
};

export const estaDestacada = (p: Publicacion) => Boolean(p.destacadaHasta && new Date(p.destacadaHasta) > new Date());

export function miniaturaDe(p: Publicacion): string | null {
  if (p.tipo === "fotos") return urlCompleta(p.fotos[0]) ?? null;
  if (p.tipo === "video") return urlCompleta(p.portadaUrl) ?? null;
  if (p.tipo === "youtube") return p.enlaceMiniatura;
  return null;
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });

/** "Para ti" en el panel (decisión 0091): todas las publicaciones, con filtros y acciones. */
export function ParaTiPublicaciones() {
  const token = useSesionAdmin((e) => e.token)!;
  const navegar = useNavigate();
  const { publicaciones, cargar, cargando, eliminar, modulos, cargarModulos } = useParaTi();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [confirmando, setConfirmando] = useState<string | null>(null);

  useEffect(() => {
    cargar(token);
    cargarModulos();
  }, [token, cargar, cargarModulos]);

  const cuentas = useMemo(
    () => ({
      todas: publicaciones.length,
      publicadas: publicaciones.filter((p) => p.estado === "publicada").length,
      destacadas: publicaciones.filter((p) => p.estado === "publicada" && estaDestacada(p)).length,
      borradores: publicaciones.filter((p) => p.estado === "borrador").length,
    }),
    [publicaciones],
  );
  const lista = publicaciones.filter((p) =>
    filtro === "todas" ? true : filtro === "publicadas" ? p.estado === "publicada" : filtro === "borradores" ? p.estado === "borrador" : p.estado === "publicada" && estaDestacada(p),
  );

  async function borrar(p: Publicacion) {
    if (await eliminar(p.id, token)) alertaExito("Publicación eliminada", p.texto.slice(0, 60) || undefined);
    else avisarErrorParaTi("No se pudo eliminar");
    setConfirmando(null);
  }

  return (
    <div className="para-ti-admin">
      <div className="topbar">
        <div>
          <h2>Para ti</h2>
          <p>Publicaciones para todos los distritos: fotos, videos, enlaces de YouTube y texto.</p>
        </div>
        <button className="btn btn-primario" onClick={() => navegar("/para-ti/nueva")}>
          ＋ Nueva publicación
        </button>
      </div>

      {modulos && !modulos.paraTi ? (
        <div className="nota-alerta" style={{ marginBottom: 14 }}>
          <span>
            La pestaña Para ti está <b>apagada</b>: los vecinos todavía no la ven. Puedes preparar publicaciones y encenderla en Módulos de la app.
          </span>
        </div>
      ) : null}

      <div className="filtros-para-ti" role="tablist" aria-label="Filtrar publicaciones">
        {(["todas", "publicadas", "destacadas", "borradores"] as Filtro[]).map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filtro === f} className={filtro === f ? "activo" : ""} onClick={() => setFiltro(f)}>
            {f === "todas" ? "Todas" : f === "publicadas" ? "Publicadas" : f === "destacadas" ? "Destacadas" : "Borradores"} <span>{cuentas[f]}</span>
          </button>
        ))}
      </div>

      {cargando && publicaciones.length === 0 ? <p className="vacio-editor">Cargando…</p> : null}
      {!cargando && lista.length === 0 ? (
        <div className="tarjeta vacio-para-ti">
          <b>{filtro === "todas" ? "Todavía no hay publicaciones." : "Nada en este filtro."}</b>
          {filtro === "todas" ? <Link to="/para-ti/nueva">Crear la primera</Link> : null}
        </div>
      ) : null}

      <div className="lista-para-ti">
        {lista.map((p) => {
          const tipo = TIPO[p.tipo];
          const mini = miniaturaDe(p);
          return (
            <div className="fila-para-ti" key={p.id}>
              <div className="mini-para-ti" style={mini ? { backgroundImage: `url(${mini})` } : undefined}>
                {mini ? null : <tipo.icono aria-hidden />}
                {p.tipo === "video" || p.tipo === "youtube" ? <span className="play-mini" aria-hidden><LuPlay /></span> : null}
              </div>
              <div className="info-para-ti">
                <div className="chips-para-ti">
                  <span className={`chip-estado ${p.estado}`}>{p.estado === "publicada" ? "Publicada" : "Borrador"}</span>
                  <span className="chip-tipo">
                    <tipo.icono aria-hidden /> {tipo.texto}
                  </span>
                  {estaDestacada(p) ? <span className="chip-destacada">Destacada hasta {fecha(p.destacadaHasta!)}</span> : null}
                  {!p.permiteComentarios ? <span className="chip-tipo">Comentarios cerrados</span> : null}
                </div>
                <p>{p.texto || p.enlaceTitulo || "Sin texto"}</p>
                <span className="meta-para-ti">
                  {p.publicadoEn ? `Publicada el ${fecha(p.publicadoEn)}` : `Creada el ${fecha(p.creadoEn)}`}
                  <span>
                    <LuHeart aria-hidden /> {p.corazones}
                  </span>
                  <span>
                    <LuMessageSquare aria-hidden /> {p.comentarios}
                  </span>
                  <span>
                    <LuShare2 aria-hidden /> {p.compartidos}
                  </span>
                </span>
              </div>
              <div className="acciones-para-ti">
                {confirmando === p.id ? (
                  <>
                    <span className="confirmar-texto">¿Eliminar para siempre?</span>
                    <button className="btn-accion-mini peligro" onClick={() => borrar(p)}>
                      Sí, eliminar
                    </button>
                    <button className="btn-accion-mini" onClick={() => setConfirmando(null)}>
                      No
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-accion-mini" onClick={() => navegar(`/para-ti/${p.id}`)}>
                      <LuPencil aria-hidden /> Editar
                    </button>
                    <button className="btn-accion-mini" aria-label="Eliminar publicación" onClick={() => setConfirmando(p.id)}>
                      <LuTrash2 aria-hidden />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
