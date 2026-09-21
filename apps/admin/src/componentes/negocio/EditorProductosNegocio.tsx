import { useCallback, useEffect, useMemo, useState } from "react";
import { Negocio, Producto, formatearPrecio } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { entorno } from "../../config/entorno";
import * as api from "../../datos/productosApi";
import { DatosProducto } from "../../datos/productosApi";
import { ModalProducto } from "./ModalProducto";

/**
 * La carta del negocio: productos agrupados por sección, con foto, precio en la moneda del
 * negocio, arrastrar para ordenar dentro de cada sección, y papelera recuperable.
 *
 * Compartido entre "Mi negocio" (dueño) y la ficha del panel (admin) — los dos pueden
 * gestionar productos.
 */
export function EditorProductosNegocio({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [papelera, setPapelera] = useState<Producto[]>([]);
  const [verPapelera, setVerPapelera] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [creandoEn, setCreandoEn] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      const [vigentes, enPapelera] = await Promise.all([
        api.listarProductos(negocio.id),
        api.listarPapelera(negocio.id, token),
      ]);
      setProductos(vigentes);
      setPapelera(enPapelera);
    } catch {
      setError("No se pudieron cargar los productos.");
      setProductos([]);
    }
  }, [negocio.id, token]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const secciones = useMemo(() => {
    const lista = productos ?? [];
    const nombres = [...new Set(lista.map((p) => p.categoriaMenu))].sort((a, b) => a.localeCompare(b, "es"));
    return nombres.map((nombre) => ({
      nombre,
      productos: lista.filter((p) => p.categoriaMenu === nombre),
    }));
  }, [productos]);

  const precioDe = (valor: number) => formatearPrecio(valor, negocio.moneda);

  async function guardar(datos: DatosProducto, fotoNueva: File | null) {
    // Al crear, la foto va en un segundo paso: hasta que el producto no existe no hay id al que
    // asociarla. Para quien lo usa sigue siendo un solo formulario.
    const guardado = editando
      ? await api.actualizarProducto(negocio.id, editando.id, datos, token)
      : await api.crearProducto(negocio.id, datos, token);
    if (fotoNueva) await api.subirFotoProducto(negocio.id, guardado.id, fotoNueva, token);
    setEditando(null);
    setCreandoEn(null);
    await recargar();
  }

  async function accion(fn: () => Promise<unknown>) {
    try {
      await fn();
      await recargar();
    } catch {
      setError("No se pudo completar la acción.");
    }
  }

  /** Reordenar dentro de una sección: se manda la lista completa ya reordenada. */
  async function soltarSobre(seccion: string, destinoId: string) {
    if (!arrastrando || arrastrando === destinoId) return;
    const enSeccion = (productos ?? []).filter((p) => p.categoriaMenu === seccion);
    const desde = enSeccion.findIndex((p) => p.id === arrastrando);
    const hasta = enSeccion.findIndex((p) => p.id === destinoId);
    if (desde < 0 || hasta < 0) return;

    const reordenados = [...enSeccion];
    const [movido] = reordenados.splice(desde, 1);
    reordenados.splice(hasta, 0, movido);
    setArrastrando(null);
    // Optimista: la lista se ve reordenada al instante y el servidor confirma después.
    setProductos((actual) => {
      if (!actual) return actual;
      const otras = actual.filter((p) => p.categoriaMenu !== seccion);
      return [...otras, ...reordenados];
    });
    await accion(() => api.reordenarProductos(negocio.id, reordenados.map((p) => p.id), token));
  }

  if (productos === null) {
    return (
      <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
        Cargando productos…
      </div>
    );
  }

  return (
    <div className="tarjeta">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <p style={{ margin: 0, fontSize: 11.5, color: "var(--texto-suave)" }}>
          La carta que ven los vecinos. Los precios van en {negocio.moneda} — se cambia en Información.
        </p>
        <button className="btn btn-primario" onClick={() => setCreandoEn(secciones[0]?.nombre ?? "")}>
          ＋ Agregar producto
        </button>
      </div>

      {error ? <div className="nota-alerta">⚠️ {error}</div> : null}

      {secciones.length === 0 ? (
        <div className="panel" style={{ padding: 28, textAlign: "center", color: "var(--texto-tenue)" }}>
          Todavía no hay productos. Agrega el primero y agrúpalo en una sección (ej. "Platos de fondo").
        </div>
      ) : null}

      {secciones.map((seccion) => (
        <div key={seccion.nombre} style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <b style={{ fontSize: 12.5 }}>
              {seccion.nombre}{" "}
              <span style={{ color: "var(--texto-tenue)", fontWeight: 400 }}>
                · {seccion.productos.length} producto{seccion.productos.length === 1 ? "" : "s"}
              </span>
            </b>
            <button className="btn-accion-mini" onClick={() => setCreandoEn(seccion.nombre)}>
              ＋ Agregar aquí
            </button>
          </div>

          <div className="lista-fotos-producto">
            {seccion.productos.map((producto) => (
              <div
                className="fila-producto-foto"
                key={producto.id}
                draggable
                onDragStart={() => setArrastrando(producto.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltarSobre(seccion.nombre, producto.id)}
                style={{ opacity: arrastrando === producto.id ? 0.4 : 1, cursor: "grab" }}
                title="Arrastra para reordenar"
              >
                <span style={{ color: "var(--texto-tenue)", fontSize: 13 }}>⠿</span>
                <div className="foto-servicio">
                  {producto.fotoUrl ? <img src={`${entorno.origenApi}${producto.fotoUrl}`} alt="" /> : "🖼️"}
                </div>
                <span className="nombre-producto-foto" style={{ flex: 1 }}>
                  {producto.nombre}
                  {producto.destacado ? <span className="pill pill-oro" style={{ marginLeft: 6 }}>Más pedido</span> : null}
                  {producto.descripcion ? (
                    <span style={{ display: "block", fontSize: 11, color: "var(--texto-tenue)" }}>
                      {producto.descripcion}
                    </span>
                  ) : null}
                </span>
                <b style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{precioDe(producto.precio)}</b>
                <button className="btn-accion-mini" onClick={() => setEditando(producto)}>
                  Editar
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ borderTop: "1px solid var(--borde)", paddingTop: 12, marginTop: 4 }}>
        <button className="btn-accion-mini" onClick={() => setVerPapelera((v) => !v)}>
          🗑️ Papelera ({papelera.length}) {verPapelera ? "▴" : "▾"}
        </button>

        {verPapelera ? (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 11.5, color: "var(--texto-suave)", margin: "0 0 8px" }}>
              Lo que mandes acá no se ve en la app, pero se puede recuperar. No se borra solo: solo desaparece
              del todo si lo eliminas definitivamente.
            </p>
            {papelera.length === 0 ? (
              <p style={{ fontSize: 11.5, color: "var(--texto-tenue)", margin: 0 }}>La papelera está vacía.</p>
            ) : (
              <div className="lista-fotos-producto">
                {papelera.map((producto) => (
                  <div className="fila-producto-foto" key={producto.id}>
                    <div className="foto-servicio">
                      {producto.fotoUrl ? <img src={`${entorno.origenApi}${producto.fotoUrl}`} alt="" /> : "🖼️"}
                    </div>
                    <span className="nombre-producto-foto" style={{ flex: 1 }}>
                      {producto.nombre}
                      <span style={{ display: "block", fontSize: 11, color: "var(--texto-tenue)" }}>
                        {producto.categoriaMenu} · {precioDe(producto.precio)}
                      </span>
                    </span>
                    <button
                      className="btn-accion-mini"
                      onClick={() => accion(() => api.restaurarProducto(negocio.id, producto.id, token))}
                    >
                      ↩️ Restaurar
                    </button>
                    {confirmandoBorrado === producto.id ? (
                      <>
                        <span style={{ fontSize: 11, color: "var(--rojo)" }}>¿Seguro? No se puede deshacer.</span>
                        <button
                          className="btn-accion-mini"
                          style={{ color: "var(--rojo)" }}
                          onClick={() =>
                            accion(async () => {
                              await api.eliminarDefinitivo(negocio.id, producto.id, token);
                              setConfirmandoBorrado(null);
                            })
                          }
                        >
                          Sí, eliminar
                        </button>
                        <button className="btn-accion-mini" onClick={() => setConfirmandoBorrado(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-accion-mini"
                        style={{ color: "var(--rojo)" }}
                        onClick={() => setConfirmandoBorrado(producto.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {editando || creandoEn !== null ? (
        <ModalProducto
          producto={editando}
          moneda={negocio.moneda}
          seccionSugerida={creandoEn ?? ""}
          secciones={secciones.map((s) => s.nombre)}
          onGuardar={guardar}
          onCerrar={() => {
            setEditando(null);
            setCreandoEn(null);
          }}
          onEliminar={
            editando
              ? async () => {
                  await accion(() => api.eliminarProducto(negocio.id, editando.id, token));
                  setEditando(null);
                }
              : undefined
          }
          onQuitarFoto={
            editando
              ? async () => {
                  await accion(() => api.quitarFotoProducto(negocio.id, editando.id, token));
                  setEditando(null);
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
