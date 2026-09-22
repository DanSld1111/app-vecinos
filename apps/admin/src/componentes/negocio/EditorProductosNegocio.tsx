import { useCallback, useEffect, useMemo, useState } from "react";
import { Negocio, Producto, formatearPrecio } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { useCategorias } from "../../estado/useCategorias";
import * as api from "../../datos/productosApi";
import { DatosProducto } from "../../datos/productosApi";
import { ModalProducto } from "./ModalProducto";
import { ModalVerProducto } from "./ModalVerProducto";
import { ModalConfirmar } from "../ModalConfirmar";
import { useToasts } from "../../estado/useToasts";
import { urlCompleta } from "../../utilidades/media";

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
  const [viendo, setViendo] = useState<Producto | null>(null);
  const [creandoEn, setCreandoEn] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState<string | null>(null);
  const [enviandoAPapelera, setEnviandoAPapelera] = useState<Producto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const avisos = useToasts((estado) => estado.mostrar);

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

  // La categoría principal (la primera de la lista) define qué campos extra pide el producto —
  // ej. talla/color en Moda. Un negocio con varias categorías no combina sus plantillas: la
  // primera es la que manda, igual que el resto del panel la trata como "la" categoría del
  // negocio. Ver docs/decisiones/0071-plan-v2-modulo-negocios.md.
  const categorias = useCategorias((estado) => estado.categorias);
  const categoriaPrincipal = useMemo(
    () => categorias.find((c) => c.id === negocio.categoriaIds[0]),
    [categorias, negocio.categoriaIds],
  );
  const atributosDef = categoriaPrincipal?.atributosProducto ?? [];
  // "Sección del menú" solo tiene sentido para categorías tipo carta (restaurantes) — para
  // catálogo, servicios, rubros u ofertas es un campo sin relación con lo que se está cargando.
  const mostrarSeccion = categoriaPrincipal?.arquetipoFicha === "menu";

  async function guardar(datos: DatosProducto, fotoNueva: File | null) {
    // Al crear, la foto va en un segundo paso: hasta que el producto no existe no hay id al que
    // asociarla. Para quien lo usa sigue siendo un solo formulario.
    const eraEdicion = Boolean(editando);
    const guardado = editando
      ? await api.actualizarProducto(negocio.id, editando.id, datos, token)
      : await api.crearProducto(negocio.id, datos, token);
    if (fotoNueva) await api.subirFotoProducto(negocio.id, guardado.id, fotoNueva, token);
    setEditando(null);
    setCreandoEn(null);
    await recargar();
    avisos(eraEdicion ? "Producto guardado con éxito" : "Producto agregado con éxito");
  }

  async function accion(fn: () => Promise<unknown>, mensajeExito?: string) {
    try {
      await fn();
      await recargar();
      if (mensajeExito) avisos(mensajeExito);
    } catch {
      setError("No se pudo completar la acción.");
      avisos("No se pudo completar la acción.", "error");
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
          {mostrarSeccion ? (
            <b style={{ fontSize: 12.5, display: "block", marginBottom: 8 }}>
              {seccion.nombre}{" "}
              <span style={{ color: "var(--texto-tenue)", fontWeight: 400 }}>
                · {seccion.productos.length} producto{seccion.productos.length === 1 ? "" : "s"}
              </span>
            </b>
          ) : null}

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
                  {producto.fotoUrl ? <img src={urlCompleta(producto.fotoUrl)} alt="" /> : "🖼️"}
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
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn-icono-crud" title="Ver" onClick={() => setViendo(producto)}>
                    👁️
                  </button>
                  <button className="btn-icono-crud" title="Editar" onClick={() => setEditando(producto)}>
                    ✏️
                  </button>
                  <button
                    className="btn-icono-crud btn-icono-crud--rojo"
                    title="Enviar a papelera"
                    onClick={() => setEnviandoAPapelera(producto)}
                  >
                    🗑️
                  </button>
                </div>
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
                      {producto.fotoUrl ? <img src={urlCompleta(producto.fotoUrl)} alt="" /> : "🖼️"}
                    </div>
                    <span className="nombre-producto-foto" style={{ flex: 1 }}>
                      {producto.nombre}
                      <span style={{ display: "block", fontSize: 11, color: "var(--texto-tenue)" }}>
                        {producto.categoriaMenu} · {precioDe(producto.precio)}
                      </span>
                    </span>
                    <button
                      className="btn-accion-mini"
                      onClick={() => accion(() => api.restaurarProducto(negocio.id, producto.id, token), "Producto restaurado con éxito")}
                    >
                      ↩️ Restaurar
                    </button>
                    {confirmandoBorrado === producto.id ? (
                      <ModalConfirmar
                        titulo="¿Eliminar este producto para siempre?"
                        mensaje={`"${producto.nombre}" y su foto se borran del todo — no se puede deshacer.`}
                        textoConfirmar="Sí, eliminar para siempre"
                        onCancelar={() => setConfirmandoBorrado(null)}
                        onConfirmar={async () => {
                          await accion(() => api.eliminarDefinitivo(negocio.id, producto.id, token), "Producto eliminado para siempre");
                          setConfirmandoBorrado(null);
                        }}
                      />
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

      {viendo ? (
        <ModalVerProducto
          producto={viendo}
          moneda={negocio.moneda}
          atributosDef={atributosDef}
          onCerrar={() => setViendo(null)}
          onEditar={() => {
            setEditando(viendo);
            setViendo(null);
          }}
        />
      ) : null}

      {editando || creandoEn !== null ? (
        <ModalProducto
          producto={editando}
          moneda={negocio.moneda}
          seccionSugerida={creandoEn ?? ""}
          secciones={secciones.map((s) => s.nombre)}
          atributosDef={atributosDef}
          mostrarSeccion={mostrarSeccion}
          onGuardar={guardar}
          onCerrar={() => {
            setEditando(null);
            setCreandoEn(null);
          }}
          onEliminar={
            editando
              ? async () => {
                  await accion(() => api.eliminarProducto(negocio.id, editando.id, token), "Producto enviado a la papelera");
                  setEditando(null);
                }
              : undefined
          }
          onQuitarFoto={
            editando
              ? async () => {
                  await accion(() => api.quitarFotoProducto(negocio.id, editando.id, token), "Foto eliminada con éxito");
                  setEditando(null);
                }
              : undefined
          }
        />
      ) : null}

      {enviandoAPapelera ? (
        <ModalConfirmar
          titulo="¿Enviar este producto a la papelera?"
          mensaje={`"${enviandoAPapelera.nombre}" deja de verse en la carta — se puede recuperar desde la papelera mientras no se borre para siempre.`}
          textoConfirmar="Sí, enviar a papelera"
          onCancelar={() => setEnviandoAPapelera(null)}
          onConfirmar={async () => {
            await accion(() => api.eliminarProducto(negocio.id, enviandoAPapelera.id, token), "Producto enviado a la papelera");
            setEnviandoAPapelera(null);
          }}
        />
      ) : null}
    </div>
  );
}
