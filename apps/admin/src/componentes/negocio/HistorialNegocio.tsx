import { useEffect, useState } from "react";
import { EventoHistorialNegocio } from "@app-vecinos/tipos";
import { apiFetch } from "../../datos/clienteApi";
import { useSesionAdmin } from "../../estado/useSesionAdmin";

const ROL: Record<string, { texto: string; clase: string }> = {
  super_admin: { texto: "Admin", clase: "admin" },
  gestor_negocios: { texto: "Gestor", clase: "gestor" },
  dueno_negocio: { texto: "Dueño", clase: "dueno" },
  validador_contenido: { texto: "Validador", clase: "validador" },
  junta_vecinal: { texto: "Junta vecinal", clase: "admin" },
};

/** Una acción de la auditoría en una frase ("guardó el horario", "agregó el producto “Latte”"). */
export function describirEvento(e: EventoHistorialNegocio): string {
  const d = (e.detalle ?? {}) as Record<string, unknown>;
  const nombre = typeof d.nombre === "string" ? ` “${d.nombre}”` : "";
  const motivo = typeof d.motivo === "string" ? `: “${d.motivo}”` : "";
  const nota = typeof d.nota === "string" ? ` con la nota “${d.nota}”` : "";
  if (e.entidad === "producto") {
    const p = {
      crear: "agregó un producto",
      actualizar: "editó un producto",
      eliminar: "envió un producto a la papelera",
      restaurar: "restauró un producto",
      eliminar_definitivo: "eliminó un producto para siempre",
    }[e.accion];
    return p ?? `hizo un cambio en un producto (${e.accion})`;
  }
  const n: Record<string, string> = {
    crear: `registró el negocio${nombre}`,
    actualizar: "guardó la información",
    actualizar_horario: "guardó el horario",
    actualizar_foto: "cambió la foto de portada",
    agregar_foto_galeria: "agregó una foto a la galería",
    agregar_oferta: `agregó la oferta${nombre}`,
    eliminar_oferta: "quitó una oferta",
    actualizar_servicios: "guardó los servicios y tarifas",
    actualizar_rubros: "guardó los rubros",
    actualizar_pasillos: "guardó los pasillos",
    aprobar: "publicó el negocio",
    rechazar: `rechazó el negocio${motivo}`,
    reenviar: `lo reenvió a revisión${nota}`,
    despublicar: "despublicó el negocio",
    archivar: "archivó el negocio",
    "restaurar-archivo": "restauró el negocio del archivo",
  };
  return n[e.accion] ?? `hizo un cambio (${e.accion})`;
}

export function fechaCorta(iso: string): string {
  const f = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(hoy.getTime() - 86_400_000);
  const hora = f.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  if (f.toDateString() === hoy.toDateString()) return `hoy ${hora}`;
  if (f.toDateString() === ayer.toDateString()) return `ayer ${hora}`;
  return `${f.toLocaleDateString("es-PE", { day: "numeric", month: "short" })} ${hora}`;
}

/**
 * Quién cambió qué en el negocio y cuándo (decisión 0086), a partir de la auditoría. Los cambios
 * anteriores a esta versión del panel solo están si esa acción ya se registraba.
 */
export function HistorialNegocio({ negocioId }: { negocioId: string }) {
  const token = useSesionAdmin((e) => e.token)!;
  const [eventos, setEventos] = useState<EventoHistorialNegocio[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    setEventos(null);
    apiFetch<EventoHistorialNegocio[]>(`/negocios/${negocioId}/historial`, { token })
      .then((r) => vigente && setEventos(r))
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, [negocioId, token]);

  if (error) return <div className="tarjeta nota-alerta">No se pudo cargar el historial. Intenta de nuevo en un momento.</div>;
  if (!eventos) return <div className="tarjeta">Cargando historial…</div>;
  return (
    <div className="tarjeta">
      <p className="ayuda-historial">Quién cambió qué en este negocio, lo más reciente primero.</p>
      {eventos.length === 0 ? (
        <p className="vacio-editor">Todavía no hay cambios registrados.</p>
      ) : (
        <ul className="lista-historial">
          {eventos.map((e, i) => {
            const rol = e.cuentaRol ? ROL[e.cuentaRol] : null;
            return (
              <li key={i}>
                <time dateTime={e.creadoEn}>{fechaCorta(e.creadoEn)}</time>
                <div>
                  <b>{e.cuentaNombre ?? "Sistema"}</b>
                  {rol ? <span className={`rol-historial ${rol.clase}`}>{rol.texto}</span> : null} {describirEvento(e)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
