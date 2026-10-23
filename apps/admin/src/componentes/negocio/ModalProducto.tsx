import { useRef, useState } from "react";
import { SelectorMoneda } from "./SelectorMoneda";
import { AtributoProductoDef, DetalleProducto, MAX_FOTOS_EXTRA, Moneda, PasoItinerario, Producto, SIMBOLO_MONEDA, SalidaTour, TipoFicha, valoresVarias } from "@app-vecinos/tipos";
import { DatosProducto } from "../../datos/productosApi";
import { urlCompleta } from "../../utilidades/media";
import { SelectorColorAtributo } from "./SelectorColorAtributo";
import { ModalConfirmar } from "../ModalConfirmar";

import { IconoEmoji } from "../IconoEmoji";
const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp";

/**
 * Alta y edición de un producto, con su foto. Al crear, la foto se sube en un segundo paso
 * (primero hay que tener el id del producto), pero para quien lo usa es un solo formulario:
 * elige la imagen acá y se encarga el componente padre.
 */
export function ModalProducto({
  producto,
  moneda,
  seccionSugerida,
  secciones,
  atributosDef = [],
  mostrarSeccion = true,
  etiquetaSeccion = "Sección del menú",
  onGuardar,
  onEliminar,
  onQuitarFoto,
  onCerrar,
  ficha,
  subirFotoExtra,
}: {
  /** Ficha de la categoría: "inmuebles" y "tours" piden más datos (decisión 0096). */
  ficha?: TipoFicha;
  /** Sube una foto extra y devuelve su URL. Sin esto no se muestra la galería. */
  subirFotoExtra?: (archivo: File) => Promise<string | null>;
  /** null = producto nuevo. */
  producto: Producto | null;
  moneda: Moneda;
  seccionSugerida: string;
  secciones: string[];
  /** Campos propios de la categoría del negocio (talla en Moda, picante en Comida…). Vacío =
   * esta categoría no define ninguno, y el formulario se queda como estaba. */
  atributosDef?: AtributoProductoDef[];
  /** false = la categoría del negocio no usa carta/menú (todo lo que no sea "menu" en
   * ArquetipoFicha) — el campo no tiene sentido ahí, así que ni se muestra: el producto se
   * guarda con categoriaMenu = "General" sin pedírselo a la persona. */
  mostrarSeccion?: boolean;
  /** "Sección del menú" (Menú) o "Sección del catálogo" (Catálogo). */
  etiquetaSeccion?: string;
  onGuardar: (datos: DatosProducto, fotoNueva: File | null) => Promise<void>;
  onEliminar?: () => Promise<void>;
  onQuitarFoto?: () => Promise<void>;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : "");
  const [categoriaMenu, setCategoriaMenu] = useState(producto?.categoriaMenu || seccionSugerida || "General");
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);
  const [atributos, setAtributos] = useState<Record<string, string>>(producto?.atributos ?? {});
  const [monedaPropia, setMonedaPropia] = useState<Moneda | null>(producto?.moneda ?? null);
  const [fotoNueva, setFotoNueva] = useState<File | null>(null);
  const [fotos, setFotos] = useState<string[]>(producto?.fotos ?? []);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [detalle, setDetalle] = useState<DetalleProducto>(producto?.detalle ?? {});
  const inputFotosExtra = useRef<HTMLInputElement>(null);
  const esTour = ficha === "tours";
  const esInmueble = ficha === "inmuebles";
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);

  const precioValido = precio.trim() !== "" && Number.isFinite(Number(precio)) && Number(precio) >= 0;
  const valido = nombre.trim() !== "" && categoriaMenu.trim() !== "" && precioValido;
  const previsualizacion = fotoNueva ? URL.createObjectURL(fotoNueva) : null;

  async function guardar() {
    if (!valido) {
      setError("Falta el nombre, la sección o un precio válido.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(
        {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          precio: Number(precio),
          categoriaMenu: categoriaMenu.trim(),
          destacado,
          atributos,
          moneda: monedaPropia,
          ...(subirFotoExtra ? { fotos } : {}),
          ...(esTour ? { detalle } : {}),
        },
        fotoNueva,
      );
    } catch {
      setError("No se pudo guardar el producto.");
      setGuardando(false);
    }
  }

  return (
    <div className="overlay-modal" onClick={onCerrar}>
      <div className="modal-card" style={{ width: esTour || esInmueble ? "min(820px, 96vw)" : "min(680px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <h3>{producto ? (esTour ? "Editar tour" : esInmueble ? "Editar inmueble" : "Editar producto") : esTour ? "Nuevo tour" : esInmueble ? "Nuevo inmueble" : "Nuevo producto"}</h3>
        <p className="sub">
          Los precios de este negocio van en {SIMBOLO_MONEDA[moneda]} ({moneda}); este producto puede usar otra moneda.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "130px minmax(0,1fr)", gap: 14 }}>
          <div>
            <div
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--superficie-hundida)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--texto-tenue)",
                fontSize: 28,
              }}
            >
              {previsualizacion ? (
                <img src={previsualizacion} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : producto?.fotoUrl ? (
                <img
                  src={urlCompleta(producto.fotoUrl)}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <IconoEmoji e="🖼️" />
              )}
            </div>

            <input
              ref={inputFoto}
              type="file"
              accept={TIPOS_ACEPTADOS}
              style={{ display: "none" }}
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                e.target.value = "";
                if (archivo) setFotoNueva(archivo);
              }}
            />
            <button
              type="button"
              className="btn-accion-mini"
              style={{ width: "100%", marginTop: 6 }}
              onClick={() => inputFoto.current?.click()}
            >
              {producto?.fotoUrl || fotoNueva ? "Cambiar foto" : "Subir foto"}
            </button>
            {fotoNueva ? (
              <button
                type="button"
                className="btn-accion-mini"
                style={{ width: "100%", marginTop: 4 }}
                onClick={() => setFotoNueva(null)}
              >
                Descartar
              </button>
            ) : producto?.fotoUrl && onQuitarFoto ? (
              <button
                type="button"
                className="btn-accion-mini"
                style={{ width: "100%", marginTop: 4, color: "var(--rojo)" }}
                onClick={onQuitarFoto}
              >
                Quitar foto
              </button>
            ) : null}
            <p style={{ fontSize: 10.5, color: "var(--texto-tenue)", margin: "6px 0 0", lineHeight: 1.45 }}>
              JPG, PNG o WEBP · hasta 5 MB
            </p>
          </div>

          <div>
            <div className="campo-modal">
              <label>Nombre</label>
              <input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={esTour ? "Ej. Full day Paracas y Huacachina" : esInmueble ? "Ej. Casa en venta con cochera" : "Ej. Lomo saltado"}
              />
            </div>
            <div className="campo-modal">
              <label>Descripción</label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={esTour ? "Ej. Un día completo por el sur: islas, desierto y oasis." : esInmueble ? "Ej. Casa de dos pisos, bien iluminada, a dos cuadras del parque." : "Ej. Con papas fritas, arroz y ensalada criolla."}
              />
            </div>
            <div className={mostrarSeccion ? "fila-2-campos" : undefined}>
              <div className="campo-modal">
                <label>{esTour ? "Precio por persona" : "Precio"}</label>
                <div className="precio-con-moneda">
                  <SelectorMoneda valor={monedaPropia} monedaNegocio={moneda} onCambiar={setMonedaPropia} etiqueta="Moneda del precio" />
                  <input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" placeholder={esTour ? "Ej. 129" : esInmueble ? "Ej. 350000" : "Ej. 28"} aria-label="Precio" />
                </div>
              </div>
              {mostrarSeccion ? (
                <SelectorSeccion
                  etiqueta={etiquetaSeccion}
                  valor={categoriaMenu}
                  secciones={secciones}
                  onCambiar={setCategoriaMenu}
                />

              ) : null}
            </div>

            {atributosDef.length > 0 ? (
              <div className="grilla-atributos">
                {atributosDef.map((def) => (
                  <div className="campo-modal" key={def.clave} style={def.tipo === "varias" ? { gridColumn: "1 / -1" } : undefined}>
                    <label>{def.etiqueta}</label>
                    {def.tipo === "numero" ? (
                      <div className="numero-con-unidad">
                        <input
                          inputMode="numeric"
                          value={atributos[def.clave] ?? ""}
                          onChange={(e) => setAtributos((a) => ({ ...a, [def.clave]: e.target.value.replace(/[^0-9.,]/g, "") }))}
                          placeholder="0"
                        />
                        {def.unidad ? <span>{def.unidad}</span> : null}
                      </div>
                    ) : def.tipo === "varias" ? (
                      <div className="chips-varias" role="group" aria-label={def.etiqueta}>
                        {(def.opciones ?? []).map((op) => {
                          const marcadas = valoresVarias(atributos[def.clave]);
                          const activa = marcadas.includes(op);
                          return (
                            <button
                              key={op}
                              type="button"
                              aria-pressed={activa}
                              className={activa ? "activa" : ""}
                              onClick={() =>
                                setAtributos((a) => ({
                                  ...a,
                                  [def.clave]: (activa ? marcadas.filter((x) => x !== op) : [...marcadas, op]).join("|"),
                                }))
                              }
                            >
                              {op}
                            </button>
                          );
                        })}
                      </div>
                    ) : def.tipo === "opciones" ? (
                      <select
                        value={atributos[def.clave] ?? ""}
                        onChange={(e) => setAtributos((a) => ({ ...a, [def.clave]: e.target.value }))}
                      >
                        <option value="">—</option>
                        {(def.opciones ?? []).map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                    ) : def.tipo === "color" ? (
                      <SelectorColorAtributo
                        valor={atributos[def.clave] ?? ""}
                        onCambiar={(clave) => setAtributos((a) => ({ ...a, [def.clave]: clave }))}
                      />
                    ) : (
                      <input
                        value={atributos[def.clave] ?? ""}
                        onChange={(e) => setAtributos((a) => ({ ...a, [def.clave]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="toggle-dueno" onClick={() => setDestacado((v) => !v)} style={{ marginTop: 4 }}>
              <div className={`switch ${destacado ? "" : "off"}`}>
                <i />
              </div>
              <div>
                <b>{esTour || esInmueble ? "Destacar" : 'Marcar como "Más pedido"'}</b>
                <span>{esTour || esInmueble ? "Sale primero en la lista que ve el vecino" : "Se destaca en la carta que ve el vecino"}</span>
              </div>
            </div>
          </div>
        </div>

        {subirFotoExtra ? (
          <div className="fotos-extra-producto">
            <label>
              Más fotos <small>· hasta {MAX_FOTOS_EXTRA}, además de la principal</small>
            </label>
            <input
              ref={inputFotosExtra}
              type="file"
              accept={TIPOS_ACEPTADOS}
              multiple
              style={{ display: "none" }}
              onChange={async (e) => {
                const lista = Array.from(e.target.files ?? []).slice(0, MAX_FOTOS_EXTRA - fotos.length);
                e.target.value = "";
                setSubiendoFoto(true);
                for (const archivo of lista) {
                  const url = await subirFotoExtra(archivo);
                  if (url) setFotos((f) => [...f, url]);
                  else setError("No se pudo subir una de las fotos.");
                }
                setSubiendoFoto(false);
              }}
            />
            <div className="grilla-fotos-extra">
              {fotos.map((f, i) => (
                <div key={f} className="foto-extra" style={{ backgroundImage: `url(${urlCompleta(f)})` }}>
                  <button type="button" aria-label={`Quitar foto ${i + 2}`} onClick={() => setFotos((l) => l.filter((x) => x !== f))}>
                    ×
                  </button>
                </div>
              ))}
              {fotos.length < MAX_FOTOS_EXTRA ? (
                <button type="button" className="agregar-foto-extra" disabled={subiendoFoto} onClick={() => inputFotosExtra.current?.click()}>
                  {subiendoFoto ? "Subiendo…" : "+ Agregar"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {esTour ? <EditorDetalleTour detalle={detalle} onCambiar={setDetalle} /> : null}

        {error ? <p style={{ fontSize: 11.5, color: "var(--rojo)", margin: "10px 0 0" }}>{error}</p> : null}

        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          {onEliminar ? (
            <button
              className="btn-cancelar"
              style={{ color: "var(--rojo)" }}
              disabled={guardando}
              onClick={() => setConfirmandoEliminar(true)}
            >
              Enviar a papelera
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-cancelar" onClick={onCerrar}>
              Cancelar
            </button>
            <button className="btn-crear" disabled={!valido || guardando} onClick={guardar}>
              {guardando ? "Guardando…" : producto ? "Guardar" : "Agregar"}
            </button>
          </div>
        </div>
      </div>

      {confirmandoEliminar && onEliminar ? (
        <ModalConfirmar
          titulo="¿Enviar este producto a la papelera?"
          mensaje={`"${nombre}" deja de verse en la carta — se puede recuperar desde la papelera mientras no se borre para siempre.`}
          textoConfirmar="Sí, enviar a papelera"
          onCancelar={() => setConfirmandoEliminar(false)}
          onConfirmar={async () => {
            await onEliminar();
            setConfirmandoEliminar(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** Fechas de salida, itinerario, incluye / no incluye, recojo y cancelación de un tour (decisión 0096). */
function EditorDetalleTour({ detalle, onCambiar }: { detalle: DetalleProducto; onCambiar: (d: DetalleProducto) => void }) {
  const salidas = detalle.salidas ?? [];
  const pasos = detalle.itinerario ?? [];
  const cambiarSalida = (i: number, cambio: Partial<SalidaTour>) =>
    onCambiar({ ...detalle, salidas: salidas.map((s, j) => (j === i ? { ...s, ...cambio } : s)) });
  const cambiarPaso = (i: number, cambio: Partial<PasoItinerario>) =>
    onCambiar({ ...detalle, itinerario: pasos.map((p, j) => (j === i ? { ...p, ...cambio } : p)) });
  const lineas = (xs?: string[]) => (xs ?? []).join("\n");
  const aLista = (texto: string) => texto.split("\n").map((x) => x.trimStart());
  const hoy = new Date().toLocaleDateString("en-CA");

  return (
    <div className="detalle-tour">
      <div className="bloque-tour">
        <label>Fechas de salida <small>· cada una con su hora y cupos; las pasadas ya no se muestran</small></label>
        {salidas.map((s, i) => (
          <div className="fila-salida" key={i}>
            <input type="date" aria-label="Fecha de salida" value={s.fecha} min={hoy} onChange={(e) => cambiarSalida(i, { fecha: e.target.value })} />
            <input type="time" aria-label="Hora de salida" value={s.hora} onChange={(e) => cambiarSalida(i, { hora: e.target.value })} />
            <input
              inputMode="numeric"
              aria-label="Cupos"
              placeholder="Cupos (vacío = sin límite)"
              value={s.cupos ?? ""}
              onChange={(e) => cambiarSalida(i, { cupos: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })}
            />
            <button type="button" className="btn-accion-mini" aria-label="Quitar fecha" onClick={() => onCambiar({ ...detalle, salidas: salidas.filter((_, j) => j !== i) })}>
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-accion-mini"
          onClick={() => onCambiar({ ...detalle, salidas: [...salidas, { fecha: salidas[salidas.length - 1]?.fecha ?? hoy, hora: salidas[salidas.length - 1]?.hora ?? "05:00", cupos: salidas[salidas.length - 1]?.cupos ?? null }] })}
        >
          + Agregar fecha
        </button>
      </div>

      <div className="bloque-tour">
        <label>Itinerario <small>· paso a paso, con la hora</small></label>
        {pasos.map((p, i) => (
          <div className="fila-paso" key={i}>
            <input aria-label="Hora" placeholder="05:00" value={p.hora} maxLength={10} onChange={(e) => cambiarPaso(i, { hora: e.target.value })} />
            <input aria-label="Qué se hace" placeholder="Ej. Recojo en San Borja" value={p.titulo} maxLength={80} onChange={(e) => cambiarPaso(i, { titulo: e.target.value })} />
            <input aria-label="Detalle (opcional)" placeholder="Detalle (opcional)" value={p.detalle ?? ""} maxLength={160} onChange={(e) => cambiarPaso(i, { detalle: e.target.value })} />
            <button type="button" className="btn-accion-mini" aria-label="Quitar paso" onClick={() => onCambiar({ ...detalle, itinerario: pasos.filter((_, j) => j !== i) })}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className="btn-accion-mini" onClick={() => onCambiar({ ...detalle, itinerario: [...pasos, { hora: "", titulo: "" }] })}>
          + Agregar paso
        </button>
      </div>

      <div className="fila-2-campos">
        <div className="campo-modal">
          <label>Incluye <small>(uno por línea)</small></label>
          <textarea rows={4} value={lineas(detalle.incluye)} onChange={(e) => onCambiar({ ...detalle, incluye: aLista(e.target.value) })} placeholder={"Transporte ida y vuelta\nGuía oficial"} />
        </div>
        <div className="campo-modal">
          <label>No incluye <small>(uno por línea)</small></label>
          <textarea rows={4} value={lineas(detalle.noIncluye)} onChange={(e) => onCambiar({ ...detalle, noIncluye: aLista(e.target.value) })} placeholder={"Almuerzo\nPropinas"} />
        </div>
      </div>
      <div className="fila-2-campos">
        <div className="campo-modal">
          <label>Punto de recojo</label>
          <input value={detalle.puntoEncuentro ?? ""} maxLength={160} onChange={(e) => onCambiar({ ...detalle, puntoEncuentro: e.target.value })} placeholder="Ej. Parque [nombre], San Borja" />
        </div>
        <div className="campo-modal">
          <label>Política de cancelación</label>
          <input value={detalle.cancelacion ?? ""} maxLength={240} onChange={(e) => onCambiar({ ...detalle, cancelacion: e.target.value })} placeholder="Ej. Gratis hasta 48 horas antes" />
        </div>
      </div>
    </div>
  );
}

const NUEVA = "__nueva__";

/**
 * Sección del producto: una lista con las secciones que ya tiene el negocio y la opción de crear
 * otra. Antes era un texto con sugerencias (datalist) que el navegador solo mostraba al borrar lo
 * escrito, así que parecía que no había opciones.
 */
function SelectorSeccion({
  etiqueta,
  valor,
  secciones,
  onCambiar,
}: {
  etiqueta: string;
  valor: string;
  secciones: string[];
  onCambiar: (seccion: string) => void;
}) {
  const opciones = Array.from(new Set([...secciones, valor].map((s) => s.trim()).filter(Boolean)));
  const [creando, setCreando] = useState(opciones.length === 0);
  const [nueva, setNueva] = useState("");

  if (creando) {
    return (
      <div className="campo-modal">
        <label htmlFor="seccion-nueva">{etiqueta}</label>
        <div className="seccion-nueva">
          <input
            id="seccion-nueva"
            value={nueva}
            autoFocus={opciones.length > 0}
            maxLength={40}
            placeholder={etiqueta.includes("catálogo") ? "Ej. Chompas" : "Ej. Platos de fondo"}
            onChange={(e) => {
              setNueva(e.target.value);
              onCambiar(e.target.value);
            }}
          />
          {opciones.length > 0 ? (
            <button
              type="button"
              className="btn-accion-mini"
              onClick={() => {
                setCreando(false);
                onCambiar(opciones.includes(valor) ? valor : opciones[0]);
              }}
            >
              Elegir de la lista
            </button>
          ) : null}
        </div>
        <p className="ayuda-modal">Escribe el nombre de la sección nueva. Aparecerá en la lista la próxima vez.</p>
      </div>
    );
  }
  return (
    <div className="campo-modal">
      <label htmlFor="seccion-producto">{etiqueta}</label>
      <select
        id="seccion-producto"
        value={opciones.includes(valor) ? valor : opciones[0]}
        onChange={(e) => {
          if (e.target.value === NUEVA) {
            setNueva("");
            setCreando(true);
            onCambiar("");
          } else onCambiar(e.target.value);
        }}
      >
        {opciones.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        <option value={NUEVA}>+ Nueva sección…</option>
      </select>
    </div>
  );
}
