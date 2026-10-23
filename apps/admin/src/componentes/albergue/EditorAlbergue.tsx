import { useEffect, useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import {
  DatosAlbergue,
  ETIQUETA_ESTADO_MASCOTA,
  ETIQUETA_ESTADO_PADRINAZGO,
  ETIQUETA_ESTADO_SOLICITUD,
  EstadoSolicitudAdopcion,
  Mascota,
  Negocio,
  NecesidadAlbergue,
  PREGUNTAS_ADOPCION,
  Padrinazgo,
  SolicitudAdopcion,
  TurnoVoluntariado,
  edadMascota,
  tamanoMascota,
} from "@app-vecinos/tipos";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { alertaError, alertaExito } from "../../estado/useToasts";
import { urlCompleta } from "../../utilidades/media";
import {
  accionPadrinazgo,
  cambiarEstadoSolicitud,
  enlaceWhatsapp,
  guardarDatosAlbergue,
  leerDatosAlbergue,
  listarMascotas,
  listarPadrinazgos,
  listarSolicitudes,
} from "../../datos/rescateApi";
import { ModalMascota } from "./ModalMascota";

type Seccion = "mascotas" | "solicitudes" | "padrinos" | "ayuda";

const SECCIONES: { id: Seccion; texto: string }[] = [
  { id: "mascotas", texto: "Mascotas" },
  { id: "solicitudes", texto: "Solicitudes" },
  { id: "padrinos", texto: "Padrinos" },
  { id: "ayuda", texto: "Cómo ayudar" },
];

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });

/**
 * Rescate animal en el panel (decisión 0097): las mascotas del albergue, las solicitudes de
 * adopción y los padrinos que llegan desde la app, y cómo ayudar (Yape, necesidades, turnos).
 * Lo usan la ficha del negocio (admin) y «Mi negocio» (dueño).
 */
export function EditorAlbergue({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((e) => e.token)!;
  const [seccion, setSeccion] = useState<Seccion>("mascotas");
  const [mascotas, setMascotas] = useState<Mascota[] | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudAdopcion[] | null>(null);
  const [padrinos, setPadrinos] = useState<Padrinazgo[] | null>(null);

  const recargar = () => {
    listarMascotas(negocio.id, token).then(setMascotas).catch((e) => alertaError("No se pudieron cargar las mascotas", e));
    listarSolicitudes(negocio.id, token).then(setSolicitudes).catch(() => setSolicitudes([]));
    listarPadrinazgos(negocio.id, token).then(setPadrinos).catch(() => setPadrinos([]));
  };
  useEffect(recargar, [negocio.id, token]);

  const nuevas = solicitudes?.filter((s) => s.estado === "nueva").length ?? 0;
  const porConfirmar = padrinos?.filter((p) => p.estado === "por_confirmar").length ?? 0;

  return (
    <div className="editor-negocio editor-albergue">
      <div className="tabs-albergue" role="tablist" aria-label="Secciones del albergue">
        {SECCIONES.map((s) => {
          const contador = s.id === "solicitudes" ? nuevas : s.id === "padrinos" ? porConfirmar : 0;
          return (
            <button key={s.id} type="button" role="tab" aria-selected={seccion === s.id} className={seccion === s.id ? "activo" : ""} onClick={() => setSeccion(s.id)}>
              {s.texto}
              {contador ? <span className="contador-albergue">{contador}</span> : null}
            </button>
          );
        })}
      </div>
      {seccion === "mascotas" ? <SeccionMascotas negocio={negocio} mascotas={mascotas} onCambio={recargar} /> : null}
      {seccion === "solicitudes" ? <SeccionSolicitudes negocio={negocio} solicitudes={solicitudes} onCambio={recargar} /> : null}
      {seccion === "padrinos" ? <SeccionPadrinos negocio={negocio} padrinos={padrinos} onCambio={recargar} /> : null}
      {seccion === "ayuda" ? <SeccionAyuda negocio={negocio} /> : null}
    </div>
  );
}

function SeccionMascotas({ negocio, mascotas, onCambio }: { negocio: Negocio; mascotas: Mascota[] | null; onCambio: () => void }) {
  const [abierta, setAbierta] = useState<Mascota | "nueva" | null>(null);
  if (!mascotas) return <div className="tarjeta"><p className="vacio-editor">Cargando…</p></div>;
  return (
    <div className="tarjeta">
      <div className="pie-editor-lista" style={{ marginTop: 0, marginBottom: 12 }}>
        <b>{mascotas.filter((m) => m.estado !== "adoptada").length} en adopción</b>
        <span className="espaciador" />
        <button type="button" className="btn btn-primario" onClick={() => setAbierta("nueva")}>
          <LuPlus /> Nueva mascota
        </button>
      </div>
      {mascotas.length === 0 ? (
        <p className="vacio-editor">Todavía no hay mascotas. Agrega la primera con sus fotos, edad y su historia.</p>
      ) : (
        <div className="grilla-mascotas">
          {mascotas.map((m) => (
            <button key={m.id} type="button" className={`tarjeta-mascota ${m.estado === "adoptada" ? "adoptada" : ""}`} onClick={() => setAbierta(m)}>
              <span className="foto-mascota" style={m.fotoUrl ? { backgroundImage: `url(${urlCompleta(m.fotoUrl)})` } : undefined}>
                {m.urgente ? <span className="pill-urgente">Urgente</span> : null}
              </span>
              <span className="datos-mascota">
                <b>{m.nombre}</b>
                <span>
                  {m.sexo === "hembra" ? "Hembra" : "Macho"} · {edadMascota(m)} · {tamanoMascota(m)}
                </span>
                <span className={`estado-mascota ${m.estado}`}>{ETIQUETA_ESTADO_MASCOTA[m.estado]}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {abierta ? (
        <ModalMascota
          negocio={negocio}
          mascota={abierta === "nueva" ? null : abierta}
          onCerrar={() => setAbierta(null)}
          onGuardado={() => {
            setAbierta(null);
            onCambio();
          }}
        />
      ) : null}
    </div>
  );
}

const ESTADOS_SOLICITUD: EstadoSolicitudAdopcion[] = ["nueva", "entrevista", "aprobada", "adoptada", "no_aprobada"];

function SeccionSolicitudes({ negocio, solicitudes, onCambio }: { negocio: Negocio; solicitudes: SolicitudAdopcion[] | null; onCambio: () => void }) {
  const token = useSesionAdmin((e) => e.token)!;
  const [elegida, setElegida] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const sel = solicitudes?.find((s) => s.id === elegida) ?? solicitudes?.[0] ?? null;
  if (!solicitudes) return <div className="tarjeta"><p className="vacio-editor">Cargando…</p></div>;
  if (!solicitudes.length)
    return (
      <div className="tarjeta">
        <p className="vacio-editor">Todavía no llegan solicitudes. Cuando un vecino toque «Quiero adoptarla» en la app, aparece aquí con sus respuestas.</p>
      </div>
    );

  async function cambiar(estado: EstadoSolicitudAdopcion) {
    if (!sel) return;
    if (estado === "adoptada" && !window.confirm(`¿${sel.mascotaNombre} se va con ${sel.nombre}? Sale de la lista de adopción y las demás solicitudes por ella se cierran.`)) return;
    setGuardando(true);
    try {
      await cambiarEstadoSolicitud(negocio.id, sel.id, estado, token);
      alertaExito("Estado actualizado", `${sel.nombre} lo ve en «Mi actividad».`);
      onCambio();
    } catch (e) {
      alertaError("No se pudo cambiar el estado", e);
    } finally {
      setGuardando(false);
    }
  }

  const wa = sel ? enlaceWhatsapp(sel.telefono, `Hola ${sel.nombre.split(" ")[0]}, te escribimos de ${negocio.nombre} por tu solicitud para adoptar a ${sel.mascotaNombre} (N.º ${sel.numero}).`) : null;

  return (
    <div className="solicitudes-albergue">
      <div className="tarjeta lista-solicitudes">
        {solicitudes.map((s) => (
          <button key={s.id} type="button" aria-pressed={sel?.id === s.id} className={sel?.id === s.id ? "activa" : ""} onClick={() => setElegida(s.id)}>
            <span className="miniatura" style={s.mascotaFotoUrl ? { backgroundImage: `url(${urlCompleta(s.mascotaFotoUrl)})` } : undefined} />
            <span className="texto">
              <b>
                {s.nombre} → {s.mascotaNombre}
              </b>
              <span>
                N.º {s.numero} · {fechaCorta(s.creadoEn)}
              </span>
            </span>
            <span className={`estado-solicitud ${s.estado}`}>{ETIQUETA_ESTADO_SOLICITUD[s.estado]}</span>
          </button>
        ))}
      </div>
      {sel ? (
        <div className="tarjeta detalle-solicitud">
          <div className="cabeza">
            <div>
              <h3>
                {sel.nombre} quiere adoptar a {sel.mascotaNombre}
              </h3>
              <p className="sub">
                Solicitud N.º {sel.numero} · {fechaCorta(sel.creadoEn)} · WhatsApp {sel.telefono || "—"}
              </p>
            </div>
            {wa ? (
              <a className="btn btn-primario" href={wa} target="_blank" rel="noreferrer">
                Escribir por WhatsApp
              </a>
            ) : null}
          </div>
          <div className="respuestas-solicitud">
            {PREGUNTAS_ADOPCION.map((p) => (
              <span key={p.id}>
                <small>{p.titulo}</small>
                <b>{sel.respuestas[p.id] ?? "—"}</b>
              </span>
            ))}
          </div>
          {sel.motivo ? (
            <div>
              <b>Por qué quiere adoptar</b>
              <p className="motivo-solicitud">{sel.motivo}</p>
            </div>
          ) : null}
          {sel.estado === "cancelada" ? (
            <p className="nota-alerta">El vecino canceló esta solicitud.</p>
          ) : (
            <div>
              <b>Estado</b> <span className="sub">· el vecino lo ve en «Mi actividad»</span>
              <div className="chips-varias" role="radiogroup" aria-label="Estado de la solicitud" style={{ marginTop: 8 }}>
                {ESTADOS_SOLICITUD.map((e) => (
                  <button key={e} type="button" role="radio" aria-checked={sel.estado === e} className={sel.estado === e ? "activa" : ""} disabled={guardando} onClick={() => sel.estado !== e && cambiar(e)}>
                    {ETIQUETA_ESTADO_SOLICITUD[e]}
                  </button>
                ))}
              </div>
              <p className="sub" style={{ marginTop: 8 }}>
                «En entrevista» o «Aprobada» dejan a la mascota «En proceso». «Adoptada» la saca de la lista y cierra las demás solicitudes por ella.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SeccionPadrinos({ negocio, padrinos, onCambio }: { negocio: Negocio; padrinos: Padrinazgo[] | null; onCambio: () => void }) {
  const token = useSesionAdmin((e) => e.token)!;
  const [trabajando, setTrabajando] = useState<string | null>(null);
  if (!padrinos) return <div className="tarjeta"><p className="vacio-editor">Cargando…</p></div>;
  const activos = padrinos.filter((p) => p.estado === "activo" || p.estado === "atrasado");
  const alMes = activos.reduce((s, p) => s + p.monto, 0);

  async function accion(p: Padrinazgo, a: "confirmar" | "cancelar") {
    if (a === "cancelar" && !window.confirm(`¿Dar de baja el padrinazgo de ${p.nombre}?`)) return;
    setTrabajando(p.id);
    try {
      await accionPadrinazgo(negocio.id, p.id, a, token);
      onCambio();
    } catch (e) {
      alertaError("No se pudo actualizar", e);
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <div className="tarjeta">
      <div className="resumen-padrinos">
        <span>
          <small>Padrinos activos</small>
          <b>{activos.length}</b>
        </span>
        <span>
          <small>Al mes</small>
          <b>S/ {alMes.toLocaleString("es-PE")}</b>
        </span>
        <span>
          <small>Por confirmar</small>
          <b className="oro">{padrinos.filter((p) => p.estado === "por_confirmar").length}</b>
        </span>
      </div>
      {padrinos.length === 0 ? (
        <p className="vacio-editor">Todavía no hay padrinos. En la app, cada mascota con «Se puede apadrinar» muestra el botón Apadrinar.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Padrino</th>
                <th>Apadrina a</th>
                <th>Aporte</th>
                <th>Último pago</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {padrinos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.nombre}</b>
                    <br />
                    <small>{p.telefono}</small>
                  </td>
                  <td>{p.mascotaNombre}</td>
                  <td>S/ {p.monto}</td>
                  <td>{p.ultimoPagoEn ? fechaCorta(p.ultimoPagoEn) : "—"}</td>
                  <td>
                    <span className={`estado-padrino ${p.estado}`}>{ETIQUETA_ESTADO_PADRINAZGO[p.estado]}</span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.estado !== "cancelado" ? (
                      <>
                        <button type="button" className="btn-accion-mini" disabled={trabajando === p.id} onClick={() => accion(p, "confirmar")}>
                          Confirmar pago
                        </button>{" "}
                        <button type="button" className="btn-accion-mini" disabled={trabajando === p.id} onClick={() => accion(p, "cancelar")}>
                          Dar de baja
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="sub" style={{ marginTop: 10 }}>
        El pago se revisa en el Yape o Plin del albergue; aquí solo se marca como recibido. Un padrino sin pago en 40 días figura como «Atrasado».
      </p>
    </div>
  );
}

const necesidadVacia = (): NecesidadAlbergue => ({ que: "", tiene: 0, meta: 10, unidad: "" });
const turnoVacio = (): TurnoVoluntariado => ({ fecha: new Date().toLocaleDateString("en-CA"), hora: "09:00", que: "", faltan: 2 });

function SeccionAyuda({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((e) => e.token)!;
  const [datos, setDatos] = useState<DatosAlbergue | null>(null);
  const [original, setOriginal] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [montos, setMontos] = useState("20, 30, 50");

  useEffect(() => {
    leerDatosAlbergue(negocio.id, token)
      .then((d) => {
        setDatos(d);
        setOriginal(JSON.stringify(d));
        if (d.montosPadrinazgo?.length) setMontos(d.montosPadrinazgo.join(", "));
      })
      .catch((e) => alertaError("No se pudieron cargar los datos del albergue", e));
  }, [negocio.id, token]);

  const listaMontos = useMemo(() => montos.split(",").map((m) => Number(m.trim())).filter((n) => Number.isFinite(n) && n > 0).slice(0, 4), [montos]);
  if (!datos) return <div className="tarjeta"><p className="vacio-editor">Cargando…</p></div>;
  const borrador: DatosAlbergue = { ...datos, montosPadrinazgo: listaMontos };
  const huboCambio = JSON.stringify(borrador) !== original;
  const necesidades = datos.necesidades ?? [];
  const turnos = datos.turnos ?? [];
  const cambiar = (c: Partial<DatosAlbergue>) => setDatos((d) => ({ ...d!, ...c }));

  async function guardar() {
    setGuardando(true);
    try {
      const guardado = await guardarDatosAlbergue(negocio.id, borrador, token);
      setDatos(guardado);
      setOriginal(JSON.stringify(guardado));
      alertaExito("Guardado", "Los vecinos ya lo ven en «Ayudar».");
    } catch (e) {
      alertaError("No se pudo guardar", e);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="tarjeta ayuda-albergue">
      <h3>Donaciones y padrinazgo</h3>
      <div className="fila-campos-albergue">
        <div className="campo">
          <label htmlFor="yape">Número de Yape o Plin</label>
          <input id="yape" value={datos.yape ?? ""} maxLength={20} placeholder="999 999 999" onChange={(e) => cambiar({ yape: e.target.value })} />
        </div>
        <div className="campo">
          <label htmlFor="titular">A nombre de</label>
          <input id="titular" value={datos.titular ?? ""} maxLength={80} onChange={(e) => cambiar({ titular: e.target.value })} />
        </div>
        <div className="campo">
          <label htmlFor="montos">Aportes sugeridos (S/ al mes)</label>
          <input id="montos" value={montos} onChange={(e) => setMontos(e.target.value)} placeholder="20, 30, 50" />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="requisitos">Requisitos para adoptar</label>
        <textarea
          id="requisitos"
          rows={3}
          maxLength={600}
          value={datos.requisitos ?? ""}
          placeholder="Ej.: Ser mayor de edad, DNI, compromiso de esterilización y visita al hogar antes de la entrega."
          onChange={(e) => cambiar({ requisitos: e.target.value })}
        />
      </div>

      <h3>Lo que necesita el albergue</h3>
      {necesidades.map((n, i) => (
        <div className="fila-necesidad" key={i}>
          <input aria-label="Qué necesita" placeholder="Croquetas para adultos" value={n.que} maxLength={60} onChange={(e) => cambiar({ necesidades: necesidades.map((x, j) => (j === i ? { ...x, que: e.target.value } : x)) })} />
          <input aria-label="Tienen" type="number" min={0} value={n.tiene} onChange={(e) => cambiar({ necesidades: necesidades.map((x, j) => (j === i ? { ...x, tiene: Number(e.target.value) || 0 } : x)) })} />
          <span>de</span>
          <input aria-label="Meta" type="number" min={1} value={n.meta} onChange={(e) => cambiar({ necesidades: necesidades.map((x, j) => (j === i ? { ...x, meta: Math.max(1, Number(e.target.value) || 1) } : x)) })} />
          <input aria-label="Unidad" placeholder="kg" value={n.unidad} maxLength={20} onChange={(e) => cambiar({ necesidades: necesidades.map((x, j) => (j === i ? { ...x, unidad: e.target.value } : x)) })} />
          <button type="button" className="btn-accion-mini" aria-label="Quitar" onClick={() => cambiar({ necesidades: necesidades.filter((_, j) => j !== i) })}>
            <LuTrash2 />
          </button>
        </div>
      ))}
      <button type="button" className="btn-accion-mini" disabled={necesidades.length >= 12} onClick={() => cambiar({ necesidades: [...necesidades, necesidadVacia()] })}>
        <LuPlus /> Agregar necesidad
      </button>

      <h3>Turnos de voluntariado</h3>
      {turnos.map((t, i) => (
        <div className="fila-turno" key={i}>
          <input aria-label="Fecha" type="date" value={t.fecha} onChange={(e) => cambiar({ turnos: turnos.map((x, j) => (j === i ? { ...x, fecha: e.target.value } : x)) })} />
          <input aria-label="Hora" type="time" value={t.hora} onChange={(e) => cambiar({ turnos: turnos.map((x, j) => (j === i ? { ...x, hora: e.target.value } : x)) })} />
          <input aria-label="Qué se hace" placeholder="Paseo de perros en el parque" value={t.que} maxLength={80} onChange={(e) => cambiar({ turnos: turnos.map((x, j) => (j === i ? { ...x, que: e.target.value } : x)) })} />
          <input aria-label="Personas que faltan" type="number" min={0} value={t.faltan} onChange={(e) => cambiar({ turnos: turnos.map((x, j) => (j === i ? { ...x, faltan: Number(e.target.value) || 0 } : x)) })} />
          <button type="button" className="btn-accion-mini" aria-label="Quitar" onClick={() => cambiar({ turnos: turnos.filter((_, j) => j !== i) })}>
            <LuTrash2 />
          </button>
        </div>
      ))}
      <button type="button" className="btn-accion-mini" disabled={turnos.length >= 20} onClick={() => cambiar({ turnos: [...turnos, turnoVacio()] })}>
        <LuPlus /> Agregar turno
      </button>

      <div className="pie-editor-lista">
        <span className="espaciador" />
        {huboCambio ? <span className="aviso-sin-guardar">Cambios sin guardar</span> : null}
        <button type="button" className="btn btn-primario" disabled={!huboCambio || guardando} onClick={guardar}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
