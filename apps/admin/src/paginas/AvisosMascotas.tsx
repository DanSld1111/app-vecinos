import { useEffect, useState } from "react";
import { AvisoMascota } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { alertaError } from "../estado/useToasts";
import { urlCompleta } from "../utilidades/media";
import { FiltroAvisos, enlaceWhatsapp, listarAvisosMascotas, moderarAvisoMascota } from "../datos/rescateApi";

const FILTROS: { id: FiltroAvisos; texto: string }[] = [
  { id: "todos", texto: "Todos" },
  { id: "reportados", texto: "Con reportes" },
  { id: "ocultos", texto: "Ocultos" },
  { id: "cerrados", texto: "Cerrados" },
];

const ETIQUETA_ESTADO: Record<AvisoMascota["estado"], string> = { publicado: "Publicado", oculto: "Oculto", cerrado: "Volvió a casa / cerrado" };

const hace = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? "hace un momento" : h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
};

/**
 * Avisos de mascotas perdidas y encontradas (decisión 0097). Los publican los vecinos y salen al
 * instante; con 3 reportes se ocultan solos. Aquí ELISUR revisa, oculta o restaura.
 */
export function AvisosMascotas() {
  const token = useSesionAdmin((e) => e.token)!;
  const [filtro, setFiltro] = useState<FiltroAvisos>("todos");
  const [avisos, setAvisos] = useState<AvisoMascota[] | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);

  useEffect(() => {
    setAvisos(null);
    listarAvisosMascotas(filtro, token).then(setAvisos).catch((e) => {
      alertaError("No se pudieron cargar los avisos", e);
      setAvisos([]);
    });
  }, [filtro, token]);

  async function moderar(a: AvisoMascota) {
    const estado = a.estado === "oculto" ? "publicado" : "oculto";
    setTrabajando(a.id);
    try {
      const nuevo = await moderarAvisoMascota(a.id, estado, token);
      setAvisos((l) => (l ?? []).map((x) => (x.id === a.id ? nuevo : x)));
    } catch (e) {
      alertaError("No se pudo actualizar el aviso", e);
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Avisos de mascotas</h2>
          <p>Perdidos y encontrados que publican los vecinos en Rescate animal</p>
        </div>
      </div>

      <div className="chips-varias" role="tablist" aria-label="Filtro" style={{ marginBottom: 16 }}>
        {FILTROS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filtro === f.id} className={filtro === f.id ? "activa" : ""} onClick={() => setFiltro(f.id)}>
            {f.texto}
          </button>
        ))}
      </div>

      <div className="editor-negocio">
        <div className="tarjeta">
          {!avisos ? (
            <p className="vacio-editor">Cargando…</p>
          ) : avisos.length === 0 ? (
            <p className="vacio-editor">No hay avisos con este filtro.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Aviso</th>
                    <th>Publicado por</th>
                    <th>Pistas</th>
                    <th>Reportes</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {avisos.map((a) => {
                    const wa = enlaceWhatsapp(a.telefono);
                    return (
                      <tr key={a.id}>
                        <td>
                          <span className="celda-aviso-mascota">
                            <span className="miniatura" style={a.fotos[0] ? { backgroundImage: `url(${urlCompleta(a.fotos[0])})` } : undefined} />
                            <span>
                              <b>{a.nombre || (a.tipo === "perdido" ? "Sin nombre" : "Mascota encontrada")}</b>
                              <br />
                              <small className={a.tipo === "perdido" ? "texto-perdido" : "texto-encontrado"}>
                                {a.tipo === "perdido" ? "Se busca" : "Encontrado"} · {hace(a.creadoEn)}
                              </small>
                              <br />
                              <small>{a.lugar}</small>
                            </span>
                          </span>
                        </td>
                        <td>
                          {a.autorNombre}
                          <br />
                          {wa ? (
                            <a href={wa} target="_blank" rel="noreferrer">
                              <small>{a.telefono}</small>
                            </a>
                          ) : null}
                        </td>
                        <td>{a.pistas}</td>
                        <td>
                          <b style={{ color: a.reportes ? "var(--rojo)" : undefined }}>{a.reportes}</b>
                        </td>
                        <td>
                          <span className={`estado-aviso-mascota ${a.estado}`}>{ETIQUETA_ESTADO[a.estado]}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {a.estado !== "cerrado" ? (
                            <button type="button" className="btn-accion-mini" disabled={trabajando === a.id} onClick={() => moderar(a)}>
                              {a.estado === "oculto" ? "Restaurar" : "Ocultar"}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="sub" style={{ marginTop: 12 }}>
          Con 3 reportes de vecinos distintos el aviso se oculta solo hasta que lo revises. A los 30 días sin actualizar deja de mostrarse.
          Aquí ves el WhatsApp de quien publicó aunque no lo haya hecho público.
        </p>
      </div>
    </>
  );
}
