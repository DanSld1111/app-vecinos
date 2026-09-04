import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Negocio } from "@app-vecinos/tipos";
import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { useCategorias } from "../estado/useCategorias";
import { IconoCategoria } from "./IconoCategoria";
import { estadoVisualDe, ETIQUETA_ESTADO_VISUAL } from "../utilidades/estadoNegocio";

export function SelectorNegocioSidebar() {
  const { misNegocios, activo, elegir } = useNegociosDelDueno();
  const categorias = useCategorias((estado) => estado.categorias);
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alHacerClicFuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("click", alHacerClicFuera);
    return () => document.removeEventListener("click", alHacerClicFuera);
  }, []);

  if (misNegocios.length <= 1 || !activo) return null;

  function iconoDe(negocio: Negocio): string {
    const categoria = categorias.find((c) => negocio.categoriaIds.includes(c.id));
    return categoria?.icono ?? "storefront-outline";
  }

  return (
    <div className="selector-negocio-sidebar" ref={contenedorRef}>
      <button type="button" className="negocio-actual-sidebar" onClick={() => setAbierto((v) => !v)}>
        <span className="icono-negocio-sidebar">
          <IconoCategoria nombre={iconoDe(activo)} size={13} />
        </span>
        <div>
          <b>{activo.nombre}</b>
          <span>{ETIQUETA_ESTADO_VISUAL[estadoVisualDe(activo)]}</span>
        </div>
        <span className="caret-negocio">{abierto ? "▴" : "▾"}</span>
      </button>
      <button type="button" className="btn-cambiar-negocio" onClick={() => setAbierto((v) => !v)}>
        🔁 Cambiar de negocio
      </button>

      {abierto ? (
        <div className="lista-negocios-dropdown">
          {misNegocios.map((negocio) => (
            <button
              key={negocio.id}
              type="button"
              className={`opcion-negocio-dropdown ${negocio.id === activo.id ? "activa" : ""}`}
              onClick={() => {
                elegir(negocio.id);
                setAbierto(false);
                navigate("/mi-negocio");
              }}
            >
              <span className="icono-op">
                <IconoCategoria nombre={iconoDe(negocio)} size={12} />
              </span>
              <div>
                <b>{negocio.nombre}</b>
                <span>{ETIQUETA_ESTADO_VISUAL[estadoVisualDe(negocio)]}</span>
              </div>
            </button>
          ))}
          <div className="opcion-ver-todos">
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                navigate("/mis-negocios");
              }}
            >
              Ver todos mis negocios →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
