import { useRef, useState } from "react";
import { FICHAS, Moneda, Negocio, ServicioOfrecido } from "@app-vecinos/tipos";
import { SelectorMoneda } from "./SelectorMoneda";
import { LuArrowDown, LuArrowUp, LuImagePlus, LuPlus, LuTrash2, LuX } from "react-icons/lu";
import { useNegocios } from "../../estado/useNegocios";
import { useCategorias } from "../../estado/useCategorias";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { urlCompleta } from "../../utilidades/media";
import { fichaDelNegocio } from "../../utilidades/fichaNegocio";
import { useEnfoqueVistaPrevia, usePublicarBorrador } from "../../estado/useBorradorNegocio";

/** Un renglón mientras se edita: el precio queda como texto hasta guardar. */
type Fila = { nombre: string; detalle: string; precio: string; fotoUrl: string | null; moneda: Moneda | null };

function aFilas(servicios: ServicioOfrecido[] | undefined): Fila[] {
  return (servicios ?? []).map((s) => ({ nombre: s.nombre, detalle: s.detalle ?? "", precio: String(s.precio), fotoUrl: s.fotoUrl ?? null, moneda: s.moneda ?? null }));
}

function aServicios(filas: Fila[]): ServicioOfrecido[] {
  return filas
    .filter((f) => f.nombre.trim())
    .map((f) => ({
      nombre: f.nombre.trim(),
      ...(f.detalle.trim() ? { detalle: f.detalle.trim() } : {}),
      precio: Number(f.precio.replace(",", ".")) || 0,
      fotoUrl: f.fotoUrl,
      ...(f.moneda ? { moneda: f.moneda } : {}),
    }));
}

/**
 * La lista de la ficha "Servicios y tarifas": nombre, detalle, precio y foto opcional de cada
 * servicio, en el orden en que se muestran. Se guarda la lista entera (PUT :id/servicios).
 * Compartido entre la ficha del panel (admin) y "Mi negocio" (dueño).
 */
export function EditorServiciosNegocio({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((e) => e.token)!;
  const categorias = useCategorias((e) => e.categorias);
  const guardarServicios = useNegocios((e) => e.guardarServicios);
  const subirFotoServicio = useNegocios((e) => e.subirFotoServicio);

  const [filas, setFilas] = useState<Fila[]>(() => aFilas(negocio.serviciosOfrecidos));
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const filaFoto = useRef<number | null>(null);

  const { ficha } = fichaDelNegocio(negocio, categorias);
  const borrador = aServicios(filas);
  usePublicarBorrador({ serviciosOfrecidos: borrador });
  useEnfoqueVistaPrevia("contenido");
  const huboCambio = JSON.stringify(borrador) !== JSON.stringify(aServicios(aFilas(negocio.serviciosOfrecidos)));
  const precioInvalido = filas.some((f) => f.nombre.trim() && (f.precio.trim() === "" || Number.isNaN(Number(f.precio.replace(",", ".")))));

  function cambiar(i: number, cambios: Partial<Fila>) {
    setFilas((l) => l.map((f, j) => (j === i ? { ...f, ...cambios } : f)));
  }
  function mover(i: number, delta: number) {
    setFilas((l) => {
      const j = i + delta;
      if (j < 0 || j >= l.length) return l;
      const copia = [...l];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }

  async function alElegirFoto(archivo: File) {
    const i = filaFoto.current;
    if (i === null) return;
    setSubiendo(i);
    const url = await subirFotoServicio(negocio.id, archivo, token);
    setSubiendo(null);
    if (url) cambiar(i, { fotoUrl: url });
  }

  async function guardar() {
    setGuardando(true);
    const ok = await guardarServicios(negocio.id, borrador, token);
    setGuardando(false);
    if (ok) setFilas(aFilas(borrador));
  }

  return (
    <div className="editor-negocio">
      <div className="tarjeta">
        {ficha === "servicios" ? null : (
          <div className="nota-alerta">
            La ficha de este negocio es <b>{FICHAS[ficha].nombre}</b>, así que esta lista todavía no se muestra en la app.
            Se puede dejar lista por si su categoría cambia a Servicios y tarifas.
          </div>
        )}

        <input
          ref={archivoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = "";
            if (archivo) alElegirFoto(archivo);
          }}
        />

        {filas.length ? (
          <div className="lista-servicios-editor">
            {filas.map((f, i) => (
              <div className="fila-servicio-editor" key={i}>
                <button
                  type="button"
                  className="foto-servicio-editor"
                  disabled={subiendo !== null}
                  title={f.fotoUrl ? "Cambiar foto" : "Agregar foto (opcional)"}
                  onClick={() => {
                    filaFoto.current = i;
                    archivoRef.current?.click();
                  }}
                  style={f.fotoUrl ? { backgroundImage: `url(${urlCompleta(f.fotoUrl)})` } : undefined}
                >
                  {subiendo === i ? "…" : f.fotoUrl ? null : <LuImagePlus />}
                </button>
                <div className="campos-servicio-editor">
                  <input aria-label="Nombre del servicio" placeholder="Nombre del servicio" value={f.nombre} maxLength={80} onChange={(e) => cambiar(i, { nombre: e.target.value })} />
                  <input aria-label="Detalle" placeholder="Detalle corto (opcional)" value={f.detalle} maxLength={120} onChange={(e) => cambiar(i, { detalle: e.target.value })} />
                </div>
                <div className="precio-con-moneda precio-servicio-editor">
                  <SelectorMoneda valor={f.moneda} monedaNegocio={negocio.moneda} onCambiar={(m) => cambiar(i, { moneda: m })} etiqueta="Moneda del servicio" />
                  <input aria-label="Precio" placeholder="Precio" inputMode="decimal" value={f.precio} onChange={(e) => cambiar(i, { precio: e.target.value })} />
                </div>
                <div className="acciones-servicio-editor">
                  <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>
                    <LuArrowUp />
                  </button>
                  <button type="button" aria-label="Bajar" disabled={i === filas.length - 1} onClick={() => mover(i, 1)}>
                    <LuArrowDown />
                  </button>
                  {f.fotoUrl ? (
                    <button type="button" aria-label="Quitar foto" title="Quitar foto" onClick={() => cambiar(i, { fotoUrl: null })}>
                      <LuX />
                    </button>
                  ) : null}
                  <button type="button" aria-label={`Borrar ${f.nombre || "servicio"}`} onClick={() => setFilas((l) => l.filter((_, j) => j !== i))}>
                    <LuTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="vacio-editor">Todavía no hay servicios. Agrega el primero con su precio.</p>
        )}

        <div className="pie-editor-lista">
          <button type="button" className="btn-accion-mini" disabled={filas.length >= 40} onClick={() => setFilas((l) => [...l, { nombre: "", detalle: "", precio: "", fotoUrl: null, moneda: null }])}>
            <LuPlus /> Agregar servicio
          </button>
          <span className="espaciador" />
          {huboCambio ? <span className="aviso-sin-guardar">Cambios sin guardar</span> : null}
          <button type="button" className="btn btn-primario" disabled={!huboCambio || guardando || precioInvalido} onClick={guardar}>
            {guardando ? "Guardando…" : "Guardar servicios"}
          </button>
        </div>
        {precioInvalido ? <p className="error-editor">Cada servicio necesita un precio en números (ej. 80 o 12.50).</p> : null}
      </div>

    </div>
  );
}
