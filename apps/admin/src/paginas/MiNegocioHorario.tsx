import { useState } from "react";
import { DiaSemana, Horarios, Negocio } from "@app-vecinos/tipos";
import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { useNegocios } from "../estado/useNegocios";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { estadoHoyTexto, listaSemanaCompleta, NOMBRE_DIA, resumenSemana } from "../utilidades/horarios";

const DIAS_ORDEN: DiaSemana[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export function MiNegocioHorario() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;
  return <FormularioHorario key={activo.id} negocio={activo} />;
}

function FormularioHorario({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const actualizarHorarios = useNegocios((estado) => estado.actualizarHorarios);
  const [horarios, setHorarios] = useState<Horarios>(negocio.horarios);
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
    const ok = await actualizarHorarios(negocio.id, horarios, token);
    if (ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
  }

  const estadoHoy = estadoHoyTexto(horarios);
  const semana = resumenSemana(horarios);
  const listaCompleta = listaSemanaCompleta(horarios);

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Horario</h2>
          <p>{negocio.nombre} · San Borja</p>
        </div>
        <button className="btn btn-primario" onClick={guardar}>
          {guardado ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>

      <TabsMiNegocio />

      <div className="layout-editor">
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
        </div>

        <div className="panel-referencia">
          <h3>Así te ven los vecinos</h3>
          <p className="sub-ref">Mismo cálculo de "abierto ahora" que usa la app — se actualiza solo.</p>
          <div className="etiqueta-pantalla">Ficha del negocio</div>
          <div className="telefono">
            <div className="pantalla-tel">
              <div className={`estado-abierto-mini ${estadoHoy.abierto ? "abierto" : "cerradonow"}`}>
                <span className={`punto-abierto ${estadoHoy.abierto ? "" : "cerrado"}`}></span>
                {estadoHoy.abierto ? `Abierto ahora · ${estadoHoy.detalle}` : estadoHoy.detalle}
              </div>
              <div className="semana-mini">
                {semana.map((d) => (
                  <div className={`dia-mini ${d.esHoy ? "hoy" : ""}`} key={d.dia}>
                    <span className="letra">{d.abreviatura}</span>
                    <div className={`punto-dia ${d.abierto ? "" : "apagado"}`} />
                  </div>
                ))}
              </div>
              <div className="lista-semana-mini">
                {listaCompleta.map((d) => (
                  <div className="fila-semana-mini" key={d.dia}>
                    <b>{d.nombre}</b>
                    <span>{d.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="nota-mini">
            Si marcas todos los días como cerrados, la app mostrará "Cerrado por ahora" sin próxima apertura.
          </p>
        </div>
      </div>
    </>
  );
}
