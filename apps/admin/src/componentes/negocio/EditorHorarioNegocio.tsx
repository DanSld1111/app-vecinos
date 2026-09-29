import { useState } from "react";
import { DiaSemana, Horarios, Negocio } from "@app-vecinos/tipos";
import { useNegocios } from "../../estado/useNegocios";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { NOMBRE_DIA } from "../../utilidades/horarios";
import { useEnfoqueVistaPrevia, usePublicarBorrador } from "../../estado/useBorradorNegocio";

const DIAS_ORDEN: DiaSemana[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

/** Compartido entre "Mi negocio" (dueño) y la ficha del panel (admin). */
export function EditorHorarioNegocio({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const actualizarHorarios = useNegocios((estado) => estado.actualizarHorarios);
  const [horarios, setHorarios] = useState<Horarios>(negocio.horarios);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  function actualizarDia(dia: DiaSemana, cambios: Partial<Horarios[DiaSemana]>) {
    setHorarios((actual) => ({ ...actual, [dia]: { ...actual[dia], ...cambios } }));
  }

  function copiarLunes() {
    const lunes = horarios.lunes;
    setHorarios((actual) => {
      const nuevo = { ...actual };
      for (const dia of DIAS_ORDEN) nuevo[dia] = { ...lunes };
      return nuevo;
    });
  }

  async function guardar() {
    setGuardando(true);
    const ok = await actualizarHorarios(negocio.id, horarios, token);
    setGuardando(false);
    if (ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
  }

  // El celular de vista previa (ConVistaPrevia) muestra este horario antes de guardar.
  usePublicarBorrador({ horarios });
  useEnfoqueVistaPrevia("horario");

  return (
    <div className="editor-negocio">
      <div className="tarjeta">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--texto-suave)" }}>
            Activa o desactiva cada día y define su horario.
          </p>
          <button className="copiar-horario" onClick={copiarLunes}>
            Copiar lunes a toda la semana
          </button>
        </div>

        {DIAS_ORDEN.map((dia) => {
          const h = horarios[dia];
          return (
            <div className="fila-dia-horario" key={dia}>
              <span className="nombre-dia">{NOMBRE_DIA[dia]}</span>
              <div
                className={`switch-dia ${h.cerrado ? "cerrado" : ""}`}
                onClick={() =>
                  actualizarDia(dia, {
                    cerrado: !h.cerrado,
                    abre: h.abre ?? "09:00",
                    cierra: h.cierra ?? "18:00",
                  })
                }
              >
                <i />
              </div>
              {h.cerrado ? (
                <span className="etiqueta-cerrado-dia">Cerrado todo el día</span>
              ) : (
                <div className="horas-dia">
                  <input value={h.abre ?? ""} onChange={(e) => actualizarDia(dia, { abre: e.target.value })} />
                  <span>–</span>
                  <input value={h.cierra ?? ""} onChange={(e) => actualizarDia(dia, { cierra: e.target.value })} />
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn btn-primario" disabled={guardando} onClick={guardar}>
            {guardando ? "Guardando…" : guardado ? "Guardado" : "Guardar cambios"}
          </button>
        </div>
      </div>

    </div>
  );
}
