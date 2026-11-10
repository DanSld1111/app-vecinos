import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { partesDeFicha } from "../utilidades/completitudNegocio";
import { FranjaFaltantes } from "./negocio/FranjaFaltantes";
import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { useCategorias } from "../estado/useCategorias";
import { pestanasDeContenido } from "../utilidades/fichaNegocio";

import { IconoEmoji } from "./IconoEmoji";
const TABS = [
  { a: "/mi-negocio", fin: true, icono: "📋", texto: "Información" },
  { a: "/mi-negocio/horario", fin: false, icono: "🕒", texto: "Horario" },
  { a: "/mi-negocio/fotos", fin: false, icono: "📷", texto: "Fotos" },
  { a: "/mi-negocio/productos", fin: false, icono: "🍽️", texto: "Productos" },
  { a: "/mi-negocio/servicios", fin: false, icono: "💼", texto: "Servicios y tarifas", contenido: "servicios" },
  { a: "/mi-negocio/rubros", fin: false, icono: "📦", texto: "Rubros", contenido: "rubros" },
  { a: "/mi-negocio/ofertas", fin: false, icono: "🏷️", texto: "Ofertas" },
  { a: "/mi-negocio/pasillos", fin: false, icono: "🛒", texto: "Pasillos", contenido: "pasillos" },
  { a: "/mi-negocio/estado", fin: false, icono: "✅", texto: "Estado" },
];

export function TabsMiNegocio() {
  const { activo } = useNegociosDelDueno();
  const categorias = useCategorias((e) => e.categorias);
  const cargarCategorias = useCategorias((e) => e.cargar);
  useEffect(() => {
    if (categorias.length === 0) cargarCategorias();
  }, [categorias.length, cargarCategorias]);
  // Servicios, Rubros y Pasillos solo si la ficha del negocio los usa (o si ya tiene datos).
  const deContenido: string[] = activo ? pestanasDeContenido(activo, categorias) : [];
  // Qué le falta a la ficha (decisión 0084). Quien entra aquí es el dueño: esa parte ya está.
  const navegar = useNavigate();
  const partes = activo ? partesDeFicha(activo, true, categorias) : [];
  const RUTA_DE: Record<string, string> = {
    "": "/mi-negocio",
    horario: "/mi-negocio/horario",
    fotos: "/mi-negocio/fotos",
    productos: "/mi-negocio/productos",
    servicios: "/mi-negocio/servicios",
    rubros: "/mi-negocio/rubros",
    ofertas: "/mi-negocio/ofertas",
  };
  const rutasConFalta = new Set(partes.filter((p) => !p.completa).map((p) => RUTA_DE[p.pestana]));
  return (
    <>
    {activo ? <FranjaFaltantes partes={partes} onIr={(tab) => navegar(RUTA_DE[tab] ?? "/mi-negocio")} /> : null}
    <div className="tabs-negocio">
      {TABS.filter((tab) => !("contenido" in tab) || deContenido.includes(tab.contenido as string)).map((tab) => (
        <NavLink
          key={tab.a}
          to={tab.a}
          end={tab.fin}
          className={({ isActive }) => `tab-negocio ${isActive ? "activo" : ""}`}
        >
          <IconoEmoji e={tab.icono} /> {tab.texto}
          {rutasConFalta.has(tab.a) ? <span className="punto-falta" title="Falta completar algo aquí" /> : null}
        </NavLink>
      ))}
    </div>
    </>
  );
}
