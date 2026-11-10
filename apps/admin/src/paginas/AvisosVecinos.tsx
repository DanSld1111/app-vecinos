import { useEffect, useRef, useState } from "react";
import {
  CIERRES_CLASIFICADO,
  ClasificadoAdmin,
  DatosClasificado,
  ESPECIES_CLASIFICADO,
  ETIQUETA_SUBTIPO,
  MAX_FOTOS_CLASIFICADO,
  SECCIONES_CLASIFICADO,
  SUBTIPOS_CLASIFICADO,
  SeccionClasificado,
  SubtipoClasificado,
  TIPOS_INMUEBLE,
  precioClasificado,
} from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { useGeografia } from "../estado/useGeografia";
import { alertaError, alertaExito } from "../estado/useToasts";
import { urlCompleta } from "../utilidades/media";
import {
  BandejaClasificados,
  DatosGuardarClasificado,
  cerrarClasificadoAdmin,
  crearClasificado,
  enlaceWhatsapp,
  guardarClasificado,
  listarClasificados,
  publicarClasificado,
  rechazarClasificado,
  resumenClasificados,
  subirFotoClasificado,
} from "../datos/clasificadosApi";

const BANDEJAS: { id: BandejaClasificados; texto: string }[] = [
  { id: "revisar", texto: "Por revisar" },
  { id: "publicados", texto: "Publicados" },
  { id: "por_vencer", texto: "Por vencer" },
  { id: "cerrados", texto: "Cerrados" },
];

const SECCIONES: SeccionClasificado[] = ["inmuebles", "mascotas", "turismo"];

const ROLES: Record<SeccionClasificado, string[]> = {
  inmuebles: ["propietario", "vecino", "inquilino"],
  mascotas: ["vecino", "su familia", "rescatista"],
  turismo: ["agencia", "organizador"],
};

const hace = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? "hace un momento" : h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
};

const vacio = (seccion: SeccionClasificado = "inmuebles"): DatosGuardarClasificado => ({
  seccion,
  subtipo: SUBTIPOS_CLASIFICADO[seccion][0].id,
  titulo: "",
  texto: "",
  fotos: [],
  referencia: "",
  datos: seccion === "inmuebles" ? { moneda: "PEN" } : {},
  contactoNombre: "",
  contactoRol: ROLES[seccion][0],
  contactoWhatsapp: "",
  contactoTelefono: "",
});

const aFormulario = (c: ClasificadoAdmin): DatosGuardarClasificado => ({
  seccion: c.seccion,
  subtipo: c.subtipo,
  titulo: c.titulo,
  texto: c.texto,
  fotos: c.fotos,
  referencia: c.referencia,
  datos: c.datos,
  contactoNombre: c.contactoNombre,
  contactoRol: c.contactoRol,
  contactoWhatsapp: c.contactoWhatsapp,
  contactoTelefono: c.contactoTelefono,
});

/**
 * Avisos de vecinos (decisión 0098): inmuebles, mascotas y turismo. Lo que envían los vecinos llega
 * «por revisar»; el equipo ordena los datos, corrige y publica por 30 días.
 */
export function AvisosVecinos() {
  const token = useSesionAdmin((e) => e.token)!;
  const comunidades = useGeografia((e) => e.comunidades);
  const cargarGeografia = useGeografia((e) => e.cargar);
  const [bandeja, setBandeja] = useState<BandejaClasificados>("revisar");
  const [seccion, setSeccion] = useState<SeccionClasificado | null>(null);
  const [lista, setLista] = useState<ClasificadoAdmin[] | null>(null);
  const [resumen, setResumen] = useState<Record<BandejaClasificados, number> | null>(null);
  const [elegido, setElegido] = useState<ClasificadoAdmin | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState<DatosGuardarClasificado>(vacio());
  const [comunidadId, setComunidadId] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!comunidades.length) cargarGeografia(token);
  }, [comunidades.length, cargarGeografia, token]);

  function recargar() {
    setLista(null);
    listarClasificados(bandeja, seccion, token)
      .then(setLista)
      .catch((e) => {
        alertaError("No se pudieron cargar los avisos", e);
        setLista([]);
      });
    resumenClasificados(token).then(setResumen).catch(() => undefined);
  }

  useEffect(recargar, [bandeja, seccion, token]); // eslint-disable-line react-hooks/exhaustive-deps

  function elegir(c: ClasificadoAdmin) {
    setNuevo(false);
    setElegido(c);
    setForm(aFormulario(c));
  }

  function cargarAMano() {
    setElegido(null);
    setNuevo(true);
    setForm(vacio(seccion ?? "inmuebles"));
    setComunidadId(comunidades[0]?.id ?? "");
  }

  const cambiar = (parcial: Partial<DatosGuardarClasificado>) => setForm((f) => ({ ...f, ...parcial }));
  const cambiarDato = (parcial: Partial<DatosClasificado>) => setForm((f) => ({ ...f, datos: { ...f.datos, ...parcial } }));
  const numero = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[^\d.]/g, "")));

  function cambiarSeccion(s: SeccionClasificado) {
    cambiar({ seccion: s, subtipo: SUBTIPOS_CLASIFICADO[s][0].id, contactoRol: ROLES[s][0] });
  }

  async function subirFotos(archivos: FileList | null) {
    if (!archivos?.length) return;
    setSubiendo(true);
    try {
      const urls: string[] = [];
      for (const a of Array.from(archivos).slice(0, MAX_FOTOS_CLASIFICADO - form.fotos.length)) {
        urls.push((await subirFotoClasificado(a, token)).url);
      }
      setForm((f) => ({ ...f, fotos: [...f.fotos, ...urls] }));
    } catch (e) {
      alertaError("No se pudo subir la foto", e);
    } finally {
      setSubiendo(false);
      if (archivo.current) archivo.current.value = "";
    }
  }

  const moverFoto = (i: number, a: number) =>
    setForm((f) => {
      const fotos = [...f.fotos];
      const [x] = fotos.splice(i, 1);
      fotos.splice(a, 0, x);
      return { ...f, fotos };
    });

  async function hacer(accion: () => Promise<ClasificadoAdmin>, mensaje: string) {
    setTrabajando(true);
    try {
      const c = await accion();
      alertaExito(mensaje);
      setNuevo(false);
      setElegido(c);
      setForm(aFormulario(c));
      recargar();
    } catch (e) {
      alertaError("No se pudo completar", e);
    } finally {
      setTrabajando(false);
    }
  }

  const guardar = () => (elegido ? hacer(() => guardarClasificado(elegido.id, form, token), "Cambios guardados") : Promise.resolve());

  const publicar = () =>
    nuevo
      ? hacer(() => crearClasificado({ ...form, comunidadId }, token), "Aviso publicado")
      : elegido
        ? hacer(async () => {
            await guardarClasificado(elegido.id, form, token);
            return publicarClasificado(elegido.id, token);
          }, "Aviso publicado por 30 días")
        : Promise.resolve();

  function rechazar() {
    if (!elegido) return;
    const motivo = window.prompt("¿Por qué no se publica? El vecino lo verá en «Mis avisos».", "Faltan fotos claras del inmueble.");
    if (!motivo?.trim()) return;
    void hacer(() => rechazarClasificado(elegido.id, motivo, token), "Aviso rechazado");
  }

  function cerrar() {
    if (!elegido) return;
    void hacer(() => cerrarClasificadoAdmin(elegido.id, CIERRES_CLASIFICADO[elegido.seccion][0].id, token), "Aviso cerrado");
  }

  const whatsappCorreccion = elegido
    ? enlaceWhatsapp(elegido.contactoWhatsapp, `Hola ${elegido.contactoNombre.split(" ")[0]}, te escribimos de ELISUR por tu aviso. Para publicarlo nos falta: `)
    : null;
  const d = form.datos;
  const editando = nuevo || elegido;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Avisos de vecinos</h2>
          <p>Inmuebles, mascotas y turismo que envían los vecinos. Revisa, ordena los datos y publica.</p>
        </div>
        <button type="button" className="btn-primario" onClick={cargarAMano}>
          + Cargar aviso a mano
        </button>
      </div>

      <div className="avc-bandejas" role="tablist" aria-label="Bandeja">
        {BANDEJAS.map((b) => (
          <button key={b.id} type="button" role="tab" aria-selected={bandeja === b.id} className={bandeja === b.id ? "activa" : ""} onClick={() => setBandeja(b.id)}>
            {b.texto}
            {resumen ? <span>{resumen[b.id]}</span> : null}
          </button>
        ))}
        <span className="avc-espacio" />
        <div className="avc-chips" role="group" aria-label="Sección">
          <button type="button" className={seccion === null ? "activa" : ""} onClick={() => setSeccion(null)}>
            Todas
          </button>
          {SECCIONES.map((s) => (
            <button key={s} type="button" className={seccion === s ? "activa" : ""} onClick={() => setSeccion(seccion === s ? null : s)}>
              {SECCIONES_CLASIFICADO[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="avc-cuerpo">
        <div className="avc-lista">
          {!lista ? (
            <p className="avc-vacio">Cargando…</p>
          ) : lista.length === 0 ? (
            <p className="avc-vacio">{bandeja === "revisar" ? "No hay avisos por revisar. ¡Todo al día!" : "No hay avisos aquí."}</p>
          ) : (
            lista.map((c) => (
              <button key={c.id} type="button" className={`avc-item ${elegido?.id === c.id ? "activo" : ""}`} onClick={() => elegir(c)}>
                <span className="avc-miniatura" style={c.fotos[0] ? { backgroundImage: `url(${urlCompleta(c.fotos[0])})` } : undefined} />
                <span className="avc-item-texto">
                  <small className={`avc-tipo ${c.seccion} ${c.subtipo}`}>
                    {SECCIONES_CLASIFICADO[c.seccion]} · {ETIQUETA_SUBTIPO[c.subtipo]}
                  </small>
                  <b>{c.titulo || c.textoOriginal.slice(0, 60) || "Sin título"}</b>
                  <small>
                    {c.contactoNombre} · {hace(c.creadoEn)} · {c.fotos.length} {c.fotos.length === 1 ? "foto" : "fotos"}
                    {c.reportes ? <em> · {c.reportes} reportes</em> : null}
                  </small>
                </span>
              </button>
            ))
          )}
        </div>

        <div className="avc-editor">
          {!editando ? (
            <p className="avc-vacio">Elige un aviso de la lista para revisarlo, o carga uno a mano.</p>
          ) : (
            <>
              <div className="avc-fila">
                <div className="avc-chips" role="group" aria-label="Sección">
                  {SECCIONES.map((s) => (
                    <button key={s} type="button" className={form.seccion === s ? "activa" : ""} onClick={() => cambiarSeccion(s)}>
                      {SECCIONES_CLASIFICADO[s]}
                    </button>
                  ))}
                </div>
                <div className="avc-chips" role="group" aria-label="Tipo de aviso">
                  {SUBTIPOS_CLASIFICADO[form.seccion].map((s) => (
                    <button key={s.id} type="button" className={form.subtipo === s.id ? "activa" : ""} onClick={() => cambiar({ subtipo: s.id as SubtipoClasificado })}>
                      {s.etiqueta}
                    </button>
                  ))}
                </div>
                {elegido ? <span className={`avc-estado ${elegido.estado}`}>{elegido.estado === "pendiente" ? "Por revisar" : elegido.estado}</span> : null}
              </div>

              <div className="avc-fotos">
                {form.fotos.map((f, i) => (
                  <div key={f} className={`avc-foto ${i === 0 ? "portada" : ""}`} style={{ backgroundImage: `url(${urlCompleta(f)})` }}>
                    <div className="avc-foto-acciones">
                      {i > 0 ? (
                        <button type="button" title="Mover a la izquierda" onClick={() => moverFoto(i, i - 1)}>
                          ←
                        </button>
                      ) : null}
                      <button type="button" title="Quitar foto" onClick={() => cambiar({ fotos: form.fotos.filter((x) => x !== f) })}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {form.fotos.length < MAX_FOTOS_CLASIFICADO ? (
                  <button type="button" className="avc-foto agregar" disabled={subiendo} onClick={() => archivo.current?.click()}>
                    {subiendo ? "Subiendo…" : "+ Fotos"}
                  </button>
                ) : null}
                <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => subirFotos(e.target.files)} />
                <small className="sub">La primera es la portada.</small>
              </div>

              {elegido?.textoOriginal ? (
                <div className="avc-original">
                  <small>LO QUE ESCRIBIÓ EL VECINO</small>
                  <p>{elegido.textoOriginal}</p>
                </div>
              ) : null}

              {nuevo ? (
                <label className="avc-campo">
                  Comunidad
                  <select value={comunidadId} onChange={(e) => setComunidadId(e.target.value)}>
                    {comunidades.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="avc-campo">
                Título que verán los vecinos
                <input type="text" maxLength={140} value={form.titulo} onChange={(e) => cambiar({ titulo: e.target.value })} placeholder="Acogedor departamento amoblado con 2 cocheras" />
              </label>

              {form.seccion === "inmuebles" ? (
                <div className="avc-grilla">
                  <label className="avc-campo">
                    Tipo
                    <select value={d.tipoInmueble ?? ""} onChange={(e) => cambiarDato({ tipoInmueble: (e.target.value || undefined) as DatosClasificado["tipoInmueble"] })}>
                      <option value="">—</option>
                      {TIPOS_INMUEBLE.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.etiqueta}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="avc-campo">
                    Precio
                    <span className="avc-precio">
                      <select value={d.moneda ?? "PEN"} onChange={(e) => cambiarDato({ moneda: e.target.value as "PEN" | "USD" })}>
                        <option value="PEN">S/</option>
                        <option value="USD">US$</option>
                      </select>
                      <input type="text" inputMode="decimal" value={d.precio ?? ""} onChange={(e) => cambiarDato({ precio: numero(e.target.value) })} />
                    </span>
                  </label>
                  <CampoNumero texto="Mantenimiento" valor={d.mantenimiento} onCambiar={(v) => cambiarDato({ mantenimiento: v })} />
                  <CampoNumero texto="Área m²" valor={d.area} onCambiar={(v) => cambiarDato({ area: v })} />
                  <CampoNumero texto="Dormitorios" valor={d.dormitorios} onCambiar={(v) => cambiarDato({ dormitorios: v })} />
                  <CampoNumero texto="Baños" valor={d.banos} onCambiar={(v) => cambiarDato({ banos: v })} />
                  <CampoNumero texto="Cocheras" valor={d.cocheras} onCambiar={(v) => cambiarDato({ cocheras: v })} />
                  <div className="avc-checks">
                    <label>
                      <input type="checkbox" checked={Boolean(d.amoblado)} onChange={(e) => cambiarDato({ amoblado: e.target.checked })} /> Amoblado
                    </label>
                    <label>
                      <input type="checkbox" checked={Boolean(d.aceptaMascotas)} onChange={(e) => cambiarDato({ aceptaMascotas: e.target.checked })} /> Pet friendly
                    </label>
                  </div>
                </div>
              ) : form.seccion === "mascotas" ? (
                <div className="avc-grilla">
                  <label className="avc-campo">
                    Especie
                    <select value={d.especie ?? ""} onChange={(e) => cambiarDato({ especie: (e.target.value || undefined) as DatosClasificado["especie"] })}>
                      <option value="">—</option>
                      {ESPECIES_CLASIFICADO.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.etiqueta}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="avc-campo">
                    Nombre
                    <input type="text" maxLength={40} value={d.nombreMascota ?? ""} onChange={(e) => cambiarDato({ nombreMascota: e.target.value })} />
                  </label>
                  <label className="avc-campo ancho">
                    {form.subtipo === "encontrado" ? "Dónde se encontró" : form.subtipo === "perdido" ? "Visto por última vez" : "Dónde está"}
                    <input type="text" value={d.lugar ?? ""} onChange={(e) => cambiarDato({ lugar: e.target.value })} placeholder="Parque de la Felicidad" />
                  </label>
                  <label className="avc-campo ancho">
                    Cuándo
                    <input type="text" value={d.cuando ?? ""} onChange={(e) => cambiarDato({ cuando: e.target.value })} placeholder="Domingo 9 nov, 7:30 p. m." />
                  </label>
                </div>
              ) : (
                <div className="avc-grilla">
                  <label className="avc-campo">
                    Destino
                    <input type="text" value={d.destino ?? ""} onChange={(e) => cambiarDato({ destino: e.target.value })} placeholder="Paracas y Huacachina" />
                  </label>
                  <label className="avc-campo">
                    Duración
                    <input type="text" value={d.duracion ?? ""} onChange={(e) => cambiarDato({ duracion: e.target.value })} placeholder="4 días / 3 noches" />
                  </label>
                  <CampoNumero texto="Precio por persona (S/)" valor={d.precioPersona} onCambiar={(v) => cambiarDato({ precioPersona: v })} />
                  <div className="avc-campo ancho">
                    Salidas
                    <div className="avc-salidas">
                      {(d.salidas ?? []).map((s, i) => (
                        <span key={`${s}-${i}`}>
                          <input
                            type="date"
                            value={s}
                            onChange={(e) => cambiarDato({ salidas: (d.salidas ?? []).map((x, j) => (j === i ? e.target.value : x)) })}
                          />
                          <button type="button" title="Quitar fecha" onClick={() => cambiarDato({ salidas: (d.salidas ?? []).filter((_, j) => j !== i) })}>
                            ✕
                          </button>
                        </span>
                      ))}
                      <button type="button" className="btn-accion-mini" onClick={() => cambiarDato({ salidas: [...(d.salidas ?? []), new Date().toISOString().slice(0, 10)] })}>
                        + Fecha
                      </button>
                    </div>
                  </div>
                  <label className="avc-campo ancho">
                    Incluye (separado por comas)
                    <input
                      type="text"
                      value={(d.incluye ?? []).join(", ")}
                      onChange={(e) => cambiarDato({ incluye: e.target.value.split(",").map((x) => x.trimStart()) })}
                      placeholder="Bus, guía, entradas"
                    />
                  </label>
                </div>
              )}

              <label className="avc-campo">
                Texto del aviso
                <textarea rows={5} maxLength={3000} value={form.texto} onChange={(e) => cambiar({ texto: e.target.value })} />
              </label>
              <label className="avc-campo">
                Referencia o zona
                <input type="text" maxLength={200} value={form.referencia} onChange={(e) => cambiar({ referencia: e.target.value })} placeholder="Av. San Borja Sur, a 1 cuadra de Av. San Luis" />
              </label>

              <div className="avc-grilla">
                <label className="avc-campo">
                  {form.seccion === "turismo" ? "Agencia u organizador" : "Nombre del anunciante"}
                  <input type="text" maxLength={80} value={form.contactoNombre} onChange={(e) => cambiar({ contactoNombre: e.target.value })} />
                </label>
                <label className="avc-campo">
                  Se muestra como
                  <select value={form.contactoRol} onChange={(e) => cambiar({ contactoRol: e.target.value })}>
                    {ROLES[form.seccion].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="avc-campo">
                  WhatsApp
                  <input type="tel" maxLength={20} value={form.contactoWhatsapp} onChange={(e) => cambiar({ contactoWhatsapp: e.target.value })} />
                </label>
                <label className="avc-campo">
                  Teléfono (opcional)
                  <input type="tel" maxLength={20} value={form.contactoTelefono} onChange={(e) => cambiar({ contactoTelefono: e.target.value })} />
                </label>
              </div>
              {elegido?.usuarioId ? (
                <p className={`avc-autoriza ${elegido.autorizaContacto ? "si" : "no"}`}>
                  {elegido.autorizaContacto ? "✓ El vecino autorizó mostrar su número." : "El vecino NO autorizó mostrar su número: el aviso saldrá sin contacto directo."}
                </p>
              ) : null}

              {precioClasificado(form) ? <p className="sub">Se verá así: {precioClasificado(form)}</p> : null}

              <div className="avc-acciones">
                <button type="button" className="btn-primario" disabled={trabajando || (nuevo && !comunidadId)} onClick={publicar}>
                  {elegido?.estado === "publicado" ? "Guardar y renovar 30 días" : "Publicar"}
                </button>
                {elegido ? (
                  <button type="button" className="btn-accion-mini" disabled={trabajando} onClick={guardar}>
                    Solo guardar
                  </button>
                ) : null}
                {elegido && whatsappCorreccion && elegido.estado === "pendiente" ? (
                  <a className="btn-accion-mini" href={whatsappCorreccion} target="_blank" rel="noreferrer">
                    Pedir corrección por WhatsApp
                  </a>
                ) : null}
                {elegido && (elegido.estado === "pendiente" || elegido.estado === "publicado") ? (
                  <button type="button" className="avc-rechazar" disabled={trabajando} onClick={rechazar}>
                    Rechazar
                  </button>
                ) : null}
                {elegido?.estado === "publicado" ? (
                  <button type="button" className="btn-accion-mini" disabled={trabajando} onClick={cerrar}>
                    Cerrar ({CIERRES_CLASIFICADO[elegido.seccion][0].etiqueta.toLowerCase()})
                  </button>
                ) : null}
              </div>
              {elegido?.estado === "publicado" ? (
                <p className="sub">
                  {elegido.vistas} vistas · {elegido.contactos} contactos · vence {elegido.venceEn ? new Date(elegido.venceEn).toLocaleDateString("es-PE") : "—"}
                </p>
              ) : null}
              {elegido?.motivoRechazo ? <p className="sub">Motivo del rechazo: {elegido.motivoRechazo}</p> : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function CampoNumero({ texto, valor, onCambiar }: { texto: string; valor: number | null | undefined; onCambiar: (v: number | null) => void }) {
  return (
    <label className="avc-campo">
      {texto}
      <input type="text" inputMode="decimal" value={valor ?? ""} onChange={(e) => onCambiar(e.target.value.trim() === "" ? null : Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} />
    </label>
  );
}
