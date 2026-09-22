import { useRef, useState } from "react";
import { AtributoProductoDef, Moneda, Producto, SIMBOLO_MONEDA } from "@app-vecinos/tipos";
import { DatosProducto } from "../../datos/productosApi";
import { urlCompleta } from "../../utilidades/media";
import { SelectorColorAtributo } from "./SelectorColorAtributo";

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
  onGuardar,
  onEliminar,
  onQuitarFoto,
  onCerrar,
}: {
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
  const [fotoNueva, setFotoNueva] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <h3>{producto ? "Editar producto" : "Nuevo producto"}</h3>
        <p className="sub">Los precios de este negocio van en {SIMBOLO_MONEDA[moneda]} ({moneda}).</p>

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
                "🖼️"
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
              <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Lomo saltado" />
            </div>
            <div className="campo-modal">
              <label>Descripción</label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Con papas fritas, arroz y ensalada criolla."
              />
            </div>
            <div className={mostrarSeccion ? "fila-2-campos" : undefined}>
              <div className="campo-modal">
                <label>Precio ({SIMBOLO_MONEDA[moneda]})</label>
                <input value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej. 28" />
              </div>
              {mostrarSeccion ? (
                <div className="campo-modal">
                  <label>Sección del menú</label>
                  <input
                    value={categoriaMenu}
                    onChange={(e) => setCategoriaMenu(e.target.value)}
                    placeholder="Ej. Platos de fondo"
                    list="secciones-menu"
                  />
                  <datalist id="secciones-menu">
                    {secciones.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              ) : null}
            </div>

            {atributosDef.length > 0 ? (
              <div className="fila-2-campos">
                {atributosDef.map((def) => (
                  <div className="campo-modal" key={def.clave}>
                    <label>{def.etiqueta}</label>
                    {def.tipo === "opciones" ? (
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
                <b>Marcar como "Más pedido"</b>
                <span>Se destaca en la carta que ve el vecino</span>
              </div>
            </div>
          </div>
        </div>

        {error ? <p style={{ fontSize: 11.5, color: "var(--rojo)", margin: "10px 0 0" }}>{error}</p> : null}

        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          {onEliminar ? (
            <button
              className="btn-cancelar"
              style={{ color: "var(--rojo)" }}
              disabled={guardando}
              onClick={onEliminar}
            >
              🗑️ Enviar a papelera
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
    </div>
  );
}
