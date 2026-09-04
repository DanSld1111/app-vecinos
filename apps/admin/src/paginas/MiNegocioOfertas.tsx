import { useState } from "react";
import { Negocio, OfertaNegocio } from "@app-vecinos/tipos";
import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { useNegocios } from "../estado/useNegocios";
import { useCategorias } from "../estado/useCategorias";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";

/** Arquetipos cuya plantilla muestra el carrusel de ofertas directo en la ficha pública. */
const ARQUETIPOS_CON_CARRUSEL_EN_FICHA = new Set(["arq-ofertas"]);

export function MiNegocioOfertas() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;
  return <FormularioOfertas key={activo.id} negocio={activo} />;
}

function FormularioOfertas({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const agregarOferta = useNegocios((estado) => estado.agregarOferta);
  const eliminarOferta = useNegocios((estado) => estado.eliminarOferta);
  const categorias = useCategorias((estado) => estado.categorias);

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [precioAnterior, setPrecioAnterior] = useState("");
  const [etiqueta, setEtiqueta] = useState("");

  const ofertas = negocio.ofertas ?? [];
  const categoriasDelNegocio = negocio.categoriaIds
    .map((id) => categorias.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const apareceEnFicha = categoriasDelNegocio.some(
    (c) => c.arquetipoId && ARQUETIPOS_CON_CARRUSEL_EN_FICHA.has(c.arquetipoId)
  );
  const nombreCategoriaPrincipal = categoriasDelNegocio[0]?.nombre ?? "Sin categoría";

  function agregar() {
    if (!nombre.trim() || !precio.trim()) return;
    const oferta: OfertaNegocio = {
      nombre: nombre.trim(),
      precio: Number(precio),
      precioOriginal: precioAnterior.trim() ? Number(precioAnterior) : undefined,
      etiqueta: etiqueta.trim() || "Oferta",
    };
    agregarOferta(negocio.id, oferta, token);
    setNombre("");
    setPrecio("");
    setPrecioAnterior("");
    setEtiqueta("");
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Ofertas</h2>
          <p>{negocio.nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      <div className="layout-editor">
        <div className="tarjeta">
          {apareceEnFicha ? (
            <div className="nota-info">
              ℹ️ Tu categoría principal es "{nombreCategoriaPrincipal}", así que estas ofertas{" "}
              <b>sí aparecen en tu ficha pública</b>.
            </div>
          ) : (
            <div className="nota-alerta">
              ⚠️ Tu categoría principal es "{nombreCategoriaPrincipal}", así que esta sección todavía{" "}
              <b>no aparece en tu ficha pública</b> — solo se muestra para negocios de categorías tipo
              supermercado. Puedes dejarlas preparadas para cuando eso cambie, o para el carrusel de ofertas
              en Buscar, que sí las toma de aquí.
            </div>
          )}

          {ofertas.length > 0 ? (
            <div className="lista-ofertas-negocio">
              {ofertas.map((o, i) => (
                <div className="fila-oferta-negocio" key={i}>
                  <span className="etiqueta-oferta">{o.etiqueta}</span>
                  <div className="info-oferta">
                    <b>{o.nombre}</b>
                  </div>
                  <span className="precio-oferta">
                    {o.precioOriginal ? <span className="tachado">S/ {o.precioOriginal}</span> : null}
                    S/ {o.precio}
                  </span>
                  <button type="button" onClick={() => eliminarOferta(negocio.id, i, token)}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="campo-modal">
            <label>Nombre de la oferta</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Parrilla familiar" />
          </div>
          <div className="fila-2-campos">
            <div className="campo-modal">
              <label>Precio</label>
              <input value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej. 71" />
            </div>
            <div className="campo-modal">
              <label>Precio anterior (opcional, para tachar)</label>
              <input value={precioAnterior} onChange={(e) => setPrecioAnterior(e.target.value)} placeholder="Ej. 89" />
            </div>
          </div>
          <div className="campo-modal" style={{ marginBottom: 0 }}>
            <label>Etiqueta corta</label>
            <input value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} placeholder="Ej. -20%, Martes, Solo hoy" />
          </div>
          <button
            className="btn btn-primario"
            style={{ marginTop: 14 }}
            onClick={agregar}
            disabled={!nombre.trim() || !precio.trim()}
          >
            ＋ Agregar oferta
          </button>
        </div>

        <div className="panel-referencia">
          <h3>{apareceEnFicha ? "Así se ve" : "Así se vería (si aplicara)"}</h3>
          <p className="sub-ref">
            {apareceEnFicha
              ? "Carrusel de ofertas dentro de tu ficha."
              : "Carrusel de ofertas dentro de tu ficha — hoy oculto para tu categoría."}
          </p>
          <div className="etiqueta-pantalla">Ficha del negocio</div>
          <div className="telefono">
            <div className="pantalla-tel">
              {ofertas.length > 0 ? (
                <div className="fila-mini-ofertas">
                  {ofertas.slice(0, 3).map((o, i) => (
                    <div className="mini-tarjeta-oferta" key={i}>
                      <div className="mini-foto-oferta">
                        <span className="mini-cinta">{o.etiqueta}</span>
                      </div>
                      <b>{o.nombre}</b>
                      <div className="mini-precios">
                        {o.precioOriginal ? <span className="tachado">S/{o.precioOriginal}</span> : null}
                        S/{o.precio}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 10.5, color: "var(--texto-tenue)", margin: 0 }}>
                  Todavía no agregaste ninguna oferta.
                </p>
              )}
            </div>
          </div>
          <p className="nota-mini">
            Estas mismas ofertas sí aparecen en el carrusel de "Buscar", sin importar tu categoría.
          </p>
        </div>
      </div>
    </>
  );
}
