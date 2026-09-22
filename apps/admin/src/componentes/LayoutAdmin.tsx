import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { RolCuenta } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { useContadorPendientes } from "../estado/useContadorPendientes";
import { useCategorias } from "../estado/useCategorias";
import { useGeografia } from "../estado/useGeografia";
import { urlCompleta } from "../utilidades/media";
import { SelectorNegocioSidebar } from "./SelectorNegocioSidebar";
import { PilaToasts } from "./PilaToasts";

interface ItemNav {
  a: string;
  texto: string;
  contador?: number;
}

function itemsPorRol(rol: RolCuenta, pendientes: number): ItemNav[] {
  switch (rol) {
    case "super_admin":
      return [
        { a: "/dashboard", texto: "Dashboard" },
        { a: "/distritos", texto: "Distritos" },
        { a: "/categorias", texto: "Categorías" },
        { a: "/plantillas", texto: "Plantillas" },
        { a: "/arquetipos", texto: "Arquetipos" },
        { a: "/negocios", texto: "Negocios" },
        { a: "/servicios", texto: "Servicios" },
        { a: "/publicidad", texto: "Publicidad" },
        { a: "/novedades", texto: "Novedades" },
        { a: "/avisos", texto: "Avisos" },
        { a: "/validacion", texto: "Validación", contador: pendientes },
        { a: "/cuentas", texto: "Cuentas" },
        { a: "/usuarios", texto: "Usuarios" },
      ];
    case "dueno_negocio":
      return [
        { a: "/mi-negocio", texto: "Mi negocio" },
        { a: "/mi-negocio/horario", texto: "Horario" },
        { a: "/mi-negocio/fotos", texto: "Fotos" },
        { a: "/mi-negocio/ofertas", texto: "Ofertas" },
        { a: "/mi-negocio/estado", texto: "Estado" },
      ];
    case "junta_vecinal":
      return [{ a: "/mis-avisos", texto: "Mis avisos" }];
    case "validador_contenido":
      return [
        { a: "/validacion", texto: "Cola de validación", contador: pendientes },
        { a: "/validacion/historial", texto: "Historial" },
      ];
    // Acceso total al módulo de negocios (alta, edición, publicar/despublicar) pero nada más
    // del panel — sin distritos, cuentas, categorías ni el resto de módulos de super_admin.
    case "gestor_negocios":
      return [{ a: "/negocios", texto: "Negocios" }];
  }
}

const NOMBRE_ROL: Record<RolCuenta, string> = {
  super_admin: "Super-admin",
  dueno_negocio: "Dueño de negocio",
  junta_vecinal: "Junta vecinal",
  validador_contenido: "Validador de contenido",
  gestor_negocios: "Gestor de negocios",
};

export function LayoutAdmin() {
  const cuenta = useSesionAdmin((estado) => estado.cuenta);
  const token = useSesionAdmin((estado) => estado.token);
  const cerrarSesion = useSesionAdmin((estado) => estado.cerrarSesion);
  const negociosPendientes = useContadorPendientes((estado) => estado.negocios);
  const avisosPendientes = useContadorPendientes((estado) => estado.avisos);
  const cargarContador = useContadorPendientes((estado) => estado.cargar);
  const cargarCategorias = useCategorias((estado) => estado.cargar);
  const cargarGeografia = useGeografia((estado) => estado.cargar);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();

  // En móvil/tablet el menú es un panel deslizable — se cierra solo al navegar,
  // para no dejarlo abierto tapando la pantalla después de elegir una opción.
  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  // El contador del sidebar necesita los pendientes desde el login, no solo después de
  // visitar Negocios/Avisos/Validación — sin esto se queda en 0 hasta la primera navegación.
  useEffect(() => {
    if (!token) return;
    if (cuenta?.rol === "super_admin" || cuenta?.rol === "validador_contenido") {
      cargarContador(token);
    }
  }, [token, cuenta?.rol, cargarContador]);

  // Igual que el contador de pendientes: varias pantallas de cualquier rol (Mi negocio,
  // Categorías, el selector de negocio) necesitan la lista de categorías desde el ingreso,
  // no recién cuando alguien visita /categorias — antes venían precargadas de un mock local.
  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  // El Dashboard también muestra "distritos activos"/"comunidades" sin pasar antes por
  // /distritos — mismo motivo que categorías arriba: no puede esperar a la primera visita
  // a esa pantalla. super_admin lo necesita para Dashboard/Distritos, y gestor_negocios para
  // los selectores de distrito/comunidad al dar de alta un negocio (Negocios.tsx) y para el
  // mapa de ubicación en la ficha (SelectorUbicacion).
  useEffect(() => {
    if (token && (cuenta?.rol === "super_admin" || cuenta?.rol === "gestor_negocios")) cargarGeografia(token);
  }, [token, cuenta?.rol, cargarGeografia]);

  if (!cuenta) return null;

  const pendientes = negociosPendientes + avisosPendientes;

  return (
    <div className="app-shell">
      <div className="topbar-movil">
        <button
          className="boton-menu-movil"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {menuAbierto ? (
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
        <span className="marca-topbar-movil">ELISUR admin</span>
      </div>

      {menuAbierto ? (
        <div className="fondo-sidebar-movil" onClick={() => setMenuAbierto(false)} />
      ) : null}

      <aside className={`sidebar ${menuAbierto ? "abierto" : ""}`}>
        <div className="marca">
          <div className="punto">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span>ELISUR admin</span>
        </div>
        {cuenta.rol === "dueno_negocio" ? <SelectorNegocioSidebar /> : null}
        <nav>
          {itemsPorRol(cuenta.rol, pendientes).map((item) => (
            <NavLink
              key={item.a}
              to={item.a}
              className={({ isActive }) => (isActive ? "activo" : undefined)}
            >
              <span className="izq">
                <span className="dot" />
                {item.texto}
              </span>
              {item.contador ? <span className="contador">{item.contador}</span> : null}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/mi-cuenta" className={({ isActive }) => `pie-usuario ${isActive ? "activo" : ""}`}>
          {cuenta.fotoUrl ? (
            <img className="avatar" src={urlCompleta(cuenta.fotoUrl)} alt="" />
          ) : (
            <div className="avatar" />
          )}
          <div>
            <b>{cuenta.nombre}</b>
            <span>{NOMBRE_ROL[cuenta.rol]}</span>
          </div>
        </NavLink>
        <button className="cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>
      <div className="contenido">
        <Outlet />
      </div>
      <PilaToasts />
    </div>
  );
}
