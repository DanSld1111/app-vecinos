import { useState } from "react";
import { Negocio, OfertaNegocio, formatearPrecio } from "@app-vecinos/tipos";
import { useNegocios } from "../../estado/useNegocios";
import { useCategorias } from "../../estado/useCategorias";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { useEnfoqueVistaPrevia, usePublicarBorrador } from "../../estado/useBorradorNegocio";

import { IconoEmoji } from "../IconoEmoji";

/** Compartido entre "Mi negocio" (dueño) y la ficha del panel (admin). */
export function EditorOfertasNegocio({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const agregarOferta = useNegocios((estado) => estado.agregarOferta);
  const eliminarOferta = useNegocios((estado) => estado.eliminarOferta);
  const categorias = useCategorias((estado) => estado.categorias);

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [precioAnterior, setPrecioAnterior] = useState("");
  const [etiqueta, setEtiqueta] = useState("");

  const ofertas = negocio.ofertas ?? [];
  // La oferta que se está escribiendo aparece en el celular antes de agregarla.
  const precioBorrador = Number(precio.replace(",", "."));
  const enCurso: OfertaNegocio | null =
    nombre.trim() && precio.trim() && Number.isFinite(precioBorrador)
      ? {
          nombre: nombre.trim(),
          precio: precioBorrador,
          precioOriginal: precioAnterior.trim() ? Number(precioAnterior.replace(",", ".")) || undefined : undefined,
          etiqueta: etiqueta.trim() || "Oferta",
        }
      : null;
  usePublicarBorrador({ ofertas: enCurso ? [...ofertas, enCurso] : ofertas });
  useEnfoqueVistaPrevia("contenido");
  const precioDe = (valor: number) => formatearPrecio(valor, negocio.moneda);
  const categoriasDelNegocio = negocio.categoriaIds
    .map((id) => categorias.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  // Solo la ficha "Ofertas y pasillos" muestra el carrusel de ofertas en la app.
  const apareceEnFicha = categoriasDelNegocio.some((c) => c.fichaEfectiva === "ofertas");
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
    <div className="editor-negocio">
      <div className="tarjeta">
        {apareceEnFicha ? (
          <div className="nota-info">
            La categoría principal es "{nombreCategoriaPrincipal}", así que estas ofertas{" "}
            <b>sí aparecen en la ficha pública</b>.
          </div>
        ) : (
          <div className="nota-alerta">
            La categoría principal es "{nombreCategoriaPrincipal}", así que esta sección todavía{" "}
            <b>no aparece en la ficha pública</b>: solo se muestra en negocios cuya ficha es "Ofertas y
            pasillos" (se elige en Categorías). Se pueden dejar preparadas para cuando eso cambie, o para el
            carrusel de ofertas en Buscar, que sí las toma de aquí.
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
                  {o.precioOriginal ? <span className="tachado">{precioDe(o.precioOriginal)}</span> : null}
                  {precioDe(o.precio)}
                </span>
                <button type="button" onClick={() => eliminarOferta(negocio.id, i, token)}>
                  <IconoEmoji e="🗑️" />
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
            <label>Precio ({negocio.moneda})</label>
            <input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" placeholder="Ej. 71" />
          </div>
          <div className="campo-modal">
            <label>Precio anterior (opcional, para tachar)</label>
            <input
              value={precioAnterior}
              onChange={(e) => setPrecioAnterior(e.target.value)}
              placeholder="Ej. 89"
            />
          </div>
        </div>
        <div className="campo-modal" style={{ marginBottom: 0 }}>
          <label>Etiqueta corta</label>
          <input
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            placeholder="Ej. -20%, Martes, Solo hoy"
          />
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

    </div>
  );
}
