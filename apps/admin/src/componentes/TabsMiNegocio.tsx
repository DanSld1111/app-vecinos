import { NavLink } from "react-router-dom";

const TABS = [
  { a: "/mi-negocio", fin: true, icono: "📋", texto: "Información" },
  { a: "/mi-negocio/horario", fin: false, icono: "🕒", texto: "Horario" },
  { a: "/mi-negocio/fotos", fin: false, icono: "📷", texto: "Fotos" },
  { a: "/mi-negocio/productos", fin: false, icono: "🍽️", texto: "Productos" },
  { a: "/mi-negocio/ofertas", fin: false, icono: "🏷️", texto: "Ofertas" },
  { a: "/mi-negocio/estado", fin: false, icono: "✅", texto: "Estado" },
];

export function TabsMiNegocio() {
  return (
    <div className="tabs-negocio">
      {TABS.map((tab) => (
        <NavLink
          key={tab.a}
          to={tab.a}
          end={tab.fin}
          className={({ isActive }) => `tab-negocio ${isActive ? "activo" : ""}`}
        >
          {tab.icono} {tab.texto}
        </NavLink>
      ))}
    </div>
  );
}
