import { useEffect, useState } from "react";
import { LuEye, LuEyeOff, LuFlag, LuTrash2 } from "react-icons/lu";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { avisarErrorParaTi, useParaTi } from "../estado/useParaTi";
import { alertaExito } from "../estado/useToasts";

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Moderación de comentarios de Para ti (decisión 0091): reportados primero; ocultar o eliminar. */
export function ParaTiComentarios() {
  const token = useSesionAdmin((e) => e.token)!;
  const { comentarios, cargarComentarios, ocultarComentario, eliminarComentario, cargando } = useParaTi();
  const [filtro, setFiltro] = useState<"reportados" | "todos">("reportados");
  const [confirmando, setConfirmando] = useState<string | null>(null);

  useEffect(() => {
    cargarComentarios(filtro, token);
  }, [filtro, token, cargarComentarios]);

  return (
    <div className="para-ti-admin">
      <div className="topbar">
        <div>
          <h2>Comentarios</h2>
          <p>Los vecinos con cuenta comentan al instante. Aquí ocultas o eliminas los que no deben estar.</p>
        </div>
      </div>

      <div className="filtros-para-ti" role="tablist" aria-label="Filtrar comentarios">
        <button type="button" role="tab" aria-selected={filtro === "reportados"} className={filtro === "reportados" ? "activo" : ""} onClick={() => setFiltro("reportados")}>
          Reportados
        </button>
        <button type="button" role="tab" aria-selected={filtro === "todos"} className={filtro === "todos" ? "activo" : ""} onClick={() => setFiltro("todos")}>
          Todos
        </button>
      </div>

      {!cargando && comentarios.length === 0 ? (
        <div className="tarjeta vacio-para-ti">
          <b>{filtro === "reportados" ? "No hay comentarios reportados." : "Todavía no hay comentarios."}</b>
        </div>
      ) : null}

      <div className="lista-para-ti">
        {comentarios.map((c) => (
          <div className={`fila-comentario ${c.oculto ? "oculto" : ""}`} key={c.id}>
            <div className="info-para-ti">
              <div className="chips-para-ti">
                <b>{c.autorNombre}</b>
                <span className="meta-para-ti">{fechaHora(c.creadoEn)}</span>
                {c.reportes ? (
                  <span className="chip-reportes">
                    <LuFlag aria-hidden /> {c.reportes === 1 ? "1 reporte" : `${c.reportes} reportes`}
                  </span>
                ) : null}
                {c.oculto ? <span className="chip-tipo">Oculto</span> : null}
              </div>
              <p>{c.texto}</p>
              <span className="meta-para-ti">En: «{c.publicacionTexto || "publicación sin texto"}»</span>
            </div>
            <div className="acciones-para-ti">
              {confirmando === c.id ? (
                <>
                  <span className="confirmar-texto">¿Eliminar?</span>
                  <button
                    className="btn-accion-mini peligro"
                    onClick={async () => {
                      if (await eliminarComentario(c.id, token)) alertaExito("Comentario eliminado");
                      else avisarErrorParaTi("No se pudo eliminar");
                      setConfirmando(null);
                    }}
                  >
                    Sí, eliminar
                  </button>
                  <button className="btn-accion-mini" onClick={() => setConfirmando(null)}>
                    No
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-accion-mini"
                    onClick={async () => {
                      if (await ocultarComentario(c.id, !c.oculto, token)) alertaExito(c.oculto ? "Comentario visible otra vez" : "Comentario oculto");
                      else avisarErrorParaTi("No se pudo cambiar");
                    }}
                  >
                    {c.oculto ? <LuEye aria-hidden /> : <LuEyeOff aria-hidden />} {c.oculto ? "Mostrar" : "Ocultar"}
                  </button>
                  <button className="btn-accion-mini" aria-label="Eliminar comentario" onClick={() => setConfirmando(c.id)}>
                    <LuTrash2 aria-hidden />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
