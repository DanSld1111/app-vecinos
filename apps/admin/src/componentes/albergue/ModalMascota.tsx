import { useRef, useState } from "react";
import { LuImagePlus, LuX } from "react-icons/lu";
import { Convive, ConvivenciaMascota, EspecieMascota, EstadoMascota, Mascota, Negocio, SaludMascota, SexoMascota, TamanoMascota } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { alertaError, alertaExito } from "../../estado/useToasts";
import { urlCompleta } from "../../utilidades/media";
import { DatosMascota, actualizarMascota, crearMascota, eliminarMascota, subirFotoMascota } from "../../datos/rescateApi";

const PERSONALIDAD = ["Cariñosa", "Juguetona", "Tranquila en casa", "Tímida", "Guardiana", "Pasea bien con correa", "Necesita espacio", "Sociable", "Activa"];
const SALUD: { clave: keyof SaludMascota; texto: string }[] = [
  { clave: "vacunas", texto: "Vacunas al día" },
  { clave: "esterilizado", texto: "Esterilizado/a" },
  { clave: "desparasitado", texto: "Desparasitado/a" },
  { clave: "microchip", texto: "Microchip" },
  { clave: "cuidadosEspeciales", texto: "Necesita cuidados especiales" },
];
const CONVIVE: { clave: keyof ConvivenciaMascota; texto: string }[] = [
  { clave: "ninos", texto: "¿Con niños?" },
  { clave: "perros", texto: "¿Con perros?" },
  { clave: "gatos", texto: "¿Con gatos?" },
];
const ESTADOS: { id: EstadoMascota; texto: string }[] = [
  { id: "disponible", texto: "Disponible para adopción" },
  { id: "en_proceso", texto: "En proceso (ya tiene solicitud)" },
  { id: "adoptada", texto: "Adoptada (sale de la lista)" },
];
const MAX_FOTOS = 10;

function Opciones<T extends string>({ etiqueta, valor, opciones, onCambiar }: { etiqueta: string; valor: T; opciones: { id: T; texto: string }[]; onCambiar: (v: T) => void }) {
  return (
    <div className="campo">
      <label>{etiqueta}</label>
      <div className="chips-varias" role="radiogroup" aria-label={etiqueta}>
        {opciones.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={valor === o.id} className={valor === o.id ? "activa" : ""} onClick={() => onCambiar(o.id)}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Crear o editar una mascota del albergue (decisión 0097). */
export function ModalMascota({ negocio, mascota, onCerrar, onGuardado }: { negocio: Negocio; mascota: Mascota | null; onCerrar: () => void; onGuardado: () => void }) {
  const token = useSesionAdmin((e) => e.token)!;
  const [nombre, setNombre] = useState(mascota?.nombre ?? "");
  const [especie, setEspecie] = useState<EspecieMascota>(mascota?.especie ?? "perro");
  const [sexo, setSexo] = useState<SexoMascota>(mascota?.sexo ?? "hembra");
  const [edad, setEdad] = useState(mascota?.edadValor != null ? String(mascota.edadValor) : "");
  const [unidad, setUnidad] = useState<"anios" | "meses">(mascota?.edadUnidad ?? "anios");
  const [tamano, setTamano] = useState<TamanoMascota>(mascota?.tamano ?? "mediano");
  const [peso, setPeso] = useState(mascota?.pesoKg != null ? String(mascota.pesoKg) : "");
  const [fotos, setFotos] = useState<string[]>(() => [mascota?.fotoUrl, ...(mascota?.fotos ?? [])].filter((f): f is string => Boolean(f)));
  const [personalidad, setPersonalidad] = useState<string[]>(mascota?.personalidad ?? []);
  const [otraPersonalidad, setOtraPersonalidad] = useState("");
  const [salud, setSalud] = useState<SaludMascota>(mascota?.salud ?? {});
  const [convivencia, setConvivencia] = useState<ConvivenciaMascota>(mascota?.convivencia ?? {});
  const [historia, setHistoria] = useState(mascota?.historia ?? "");
  const [estado, setEstado] = useState<EstadoMascota>(mascota?.estado ?? "disponible");
  const [urgente, setUrgente] = useState(mascota?.urgente ?? false);
  const [apadrinable, setApadrinable] = useState(mascota?.apadrinable ?? true);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  const edadNum = edad.trim() === "" ? null : Number(edad);
  const pesoNum = peso.trim() === "" ? null : Number(peso.replace(",", "."));
  const valido = nombre.trim().length > 0 && fotos.length > 0 && (edadNum === null || (Number.isInteger(edadNum) && edadNum >= 0 && edadNum <= 40)) && (pesoNum === null || (pesoNum >= 0 && pesoNum <= 150));
  const opcionesPersonalidad = [...new Set([...PERSONALIDAD, ...personalidad])];

  async function subir(lista: FileList) {
    setSubiendo(true);
    try {
      for (const f of Array.from(lista).slice(0, MAX_FOTOS - fotos.length)) {
        const { url } = await subirFotoMascota(negocio.id, f, token);
        setFotos((l) => [...l, url]);
      }
    } catch (e) {
      alertaError("No se pudo subir la foto", e);
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    const datos: DatosMascota = {
      nombre: nombre.trim(),
      especie,
      sexo,
      edadValor: edadNum,
      edadUnidad: unidad,
      tamano,
      pesoKg: pesoNum,
      fotoUrl: fotos[0] ?? null,
      fotos: fotos.slice(1),
      personalidad,
      salud,
      convivencia,
      historia: historia.trim(),
      estado,
      urgente,
      apadrinable,
    };
    setGuardando(true);
    try {
      if (mascota) await actualizarMascota(negocio.id, mascota.id, datos, token);
      else await crearMascota(negocio.id, datos, token);
      alertaExito(mascota ? "Mascota actualizada" : "Mascota publicada", estado === "adoptada" ? "Ya no se muestra para adopción." : "Los vecinos ya la ven en Rescate animal.");
      onGuardado();
    } catch (e) {
      alertaError("No se pudo guardar", e);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!mascota || !window.confirm(`¿Borrar a ${mascota.nombre}? También se borran sus solicitudes y padrinos. Si fue adoptada, mejor márcala como «Adoptada».`)) return;
    setGuardando(true);
    try {
      await eliminarMascota(negocio.id, mascota.id, token);
      onGuardado();
    } catch (e) {
      alertaError("No se pudo borrar", e);
      setGuardando(false);
    }
  }

  return (
    <div className="overlay-modal" onClick={onCerrar}>
      <div className="modal-card modal-mascota" style={{ width: "min(860px, 96vw)" }} onClick={(e) => e.stopPropagation()}>
        <h3>{mascota ? `Editar a ${mascota.nombre}` : "Nueva mascota"}</h3>
        <p className="sub">Las fotos de cara y de cuerpo entero son las que más ayudan a que la adopten. La primera es la portada.</p>

        <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: "none" }} onChange={(e) => {
          if (e.target.files?.length) subir(e.target.files);
          e.target.value = "";
        }} />
        <div className="grilla-fotos-extra" style={{ marginBottom: 14 }}>
          {fotos.map((f, i) => (
            <span key={f} className="foto-extra" style={{ backgroundImage: `url(${urlCompleta(f)})` }}>
              {i === 0 ? <span className="pill-portada">Portada</span> : null}
              <button type="button" aria-label="Quitar foto" onClick={() => setFotos((l) => l.filter((x) => x !== f))}>
                <LuX />
              </button>
            </span>
          ))}
          {fotos.length < MAX_FOTOS ? (
            <button type="button" className="agregar-foto-extra" disabled={subiendo} onClick={() => archivo.current?.click()}>
              <LuImagePlus /> {subiendo ? "Subiendo…" : "Agregar"}
            </button>
          ) : null}
        </div>

        <div className="fila-campos-albergue">
          <div className="campo">
            <label htmlFor="m-nombre">Nombre</label>
            <input id="m-nombre" value={nombre} maxLength={40} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <Opciones etiqueta="Especie" valor={especie} onCambiar={setEspecie} opciones={[{ id: "perro", texto: "Perro" }, { id: "gato", texto: "Gato" }, { id: "otro", texto: "Otro" }]} />
          <Opciones etiqueta="Sexo" valor={sexo} onCambiar={setSexo} opciones={[{ id: "hembra", texto: "Hembra" }, { id: "macho", texto: "Macho" }]} />
        </div>
        <div className="fila-campos-albergue">
          <div className="campo">
            <label htmlFor="m-edad">Edad aproximada</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input id="m-edad" inputMode="numeric" style={{ width: 70 }} value={edad} onChange={(e) => setEdad(e.target.value.replace(/\D/g, ""))} />
              <select value={unidad} onChange={(e) => setUnidad(e.target.value as "anios" | "meses")} aria-label="Unidad de la edad">
                <option value="anios">años</option>
                <option value="meses">meses</option>
              </select>
            </div>
          </div>
          <Opciones etiqueta="Tamaño" valor={tamano} onCambiar={setTamano} opciones={[{ id: "pequeno", texto: "Pequeño" }, { id: "mediano", texto: "Mediano" }, { id: "grande", texto: "Grande" }]} />
          <div className="campo">
            <label htmlFor="m-peso">Peso (kg)</label>
            <input id="m-peso" inputMode="decimal" style={{ width: 90 }} value={peso} onChange={(e) => setPeso(e.target.value)} />
          </div>
        </div>

        <div className="campo">
          <label>Salud</label>
          <div className="checks-albergue">
            {SALUD.map((s) => (
              <label key={s.clave}>
                <input type="checkbox" checked={Boolean(salud[s.clave])} onChange={(e) => setSalud((x) => ({ ...x, [s.clave]: e.target.checked }))} />
                {s.texto}
              </label>
            ))}
          </div>
        </div>
        <div className="fila-campos-albergue">
          {CONVIVE.map((c) => (
            <Opciones<Convive>
              key={c.clave}
              etiqueta={c.texto}
              valor={convivencia[c.clave] ?? "nose"}
              onCambiar={(v) => setConvivencia((x) => ({ ...x, [c.clave]: v }))}
              opciones={[{ id: "si", texto: "Sí" }, { id: "no", texto: "No" }, { id: "nose", texto: "No sé" }]}
            />
          ))}
        </div>
        <div className="campo">
          <label>Personalidad · marca las que apliquen</label>
          <div className="chips-varias">
            {opcionesPersonalidad.map((p) => {
              const activa = personalidad.includes(p);
              return (
                <button key={p} type="button" aria-pressed={activa} className={activa ? "activa" : ""} onClick={() => setPersonalidad((l) => (activa ? l.filter((x) => x !== p) : [...l, p].slice(0, 12)))}>
                  {p}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input placeholder="Otra (ej. Le encanta el agua)" value={otraPersonalidad} maxLength={40} onChange={(e) => setOtraPersonalidad(e.target.value)} />
            <button type="button" className="btn-accion-mini" disabled={!otraPersonalidad.trim()} onClick={() => {
              setPersonalidad((l) => [...new Set([...l, otraPersonalidad.trim()])].slice(0, 12));
              setOtraPersonalidad("");
            }}>
              Agregar
            </button>
          </div>
        </div>
        <div className="campo">
          <label htmlFor="m-historia">Su historia</label>
          <textarea id="m-historia" rows={4} maxLength={1500} value={historia} placeholder="Cómo llegó al albergue, cómo es hoy y qué familia le haría bien." onChange={(e) => setHistoria(e.target.value)} />
        </div>

        <Opciones etiqueta="Estado" valor={estado} onCambiar={setEstado} opciones={ESTADOS} />
        <div className="checks-albergue">
          <label>
            <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} />
            Marcar como urgente (sale primero, con la etiqueta «Urgente»)
          </label>
          <label>
            <input type="checkbox" checked={apadrinable} onChange={(e) => setApadrinable(e.target.checked)} />
            Se puede apadrinar
          </label>
        </div>

        {!fotos.length ? <p style={{ fontSize: 12, color: "var(--rojo)", margin: "10px 0 0" }}>Agrega al menos una foto.</p> : null}
        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          {mascota ? (
            <button className="btn-cancelar" style={{ color: "var(--rojo)", flex: "none" }} disabled={guardando} onClick={eliminar}>
              Borrar
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-cancelar" onClick={onCerrar}>
              Cancelar
            </button>
            <button className="btn-crear" disabled={!valido || guardando || subiendo} onClick={guardar}>
              {guardando ? "Guardando…" : mascota ? "Guardar" : "Publicar mascota"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
