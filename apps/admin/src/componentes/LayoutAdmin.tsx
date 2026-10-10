import { Fragment, useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuBadgeCheck,
  LuCalendarDays,
  LuSquarePlus,
  LuClock,
  LuFlag,
  LuHistory,
  LuHouse,
  LuImage,
  LuKeyRound,
  LuLayoutDashboard,
  LuLayoutGrid,
  LuLayoutTemplate,
  LuLogOut,
  LuMap,
  LuMegaphone,
  LuMessageSquare,
  LuMoon,
  LuNewspaper,
  LuPercent,
  LuPlus,
  LuSparkles,
  LuStore,
  LuSun,
  LuTag,
  LuToggleRight,
  LuUsers,
} from "react-icons/lu";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useParaTi, usePanelActivo } from "../estado/useParaTi";
import { RolCuenta } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { useNegocios } from "../estado/useNegocios";
import { useContadorPendientes } from "../estado/useContadorPendientes";
import { useCategorias } from "../estado/useCategorias";
import { useGeografia } from "../estado/useGeografia";
import { urlCompleta } from "../utilidades/media";
import { SelectorNegocioSidebar } from "./SelectorNegocioSidebar";
import { PilaToasts } from "./PilaToasts";
import { temaEfectivo, useTemaAdmin } from "../estado/useTemaAdmin";

interface ItemNav {
  a: string;
  texto: string;
  icono: IconType;
  /** Rótulo del grupo del menú (Territorio, Catálogo…); el primer ítem de cada grupo lo muestra. */
  grupo?: string;
  contador?: number;
}

/** El módulo Para ti: lo que ve el Editor de redes sociales, y el super admin en ese panel (0091, 0092). */
const itemsParaTi = (reportados: number): ItemNav[] => [
  { a: "/para-ti", texto: "Inicio", icono: LuHouse, grupo: "Para ti" },
  { a: "/para-ti/nueva", texto: "Crear", icono: LuSquarePlus },
  { a: "/para-ti/publicaciones", texto: "Publicaciones", icono: LuLayoutGrid },
  { a: "/para-ti/calendario", texto: "Calendario", icono: LuCalendarDays },
  { a: "/para-ti/comentarios", texto: "Comentarios", icono: LuMessageSquare, contador: reportados },
];

function itemsPorRol(rol: RolCuenta, pendientes: number, rechazados = 0, panel: "admin" | "para-ti" = "admin", reportados = 0): ItemNav[] {
  switch (rol) {
    case "super_admin":
      if (panel === "para-ti") return itemsParaTi(reportados);
      return [
        { a: "/dashboard", texto: "Dashboard", icono: LuLayoutDashboard, grupo: "General" },
        { a: "/modulos", texto: "Módulos de la app", icono: LuToggleRight },
        { a: "/distritos", texto: "Distritos", icono: LuMap, grupo: "Territorio" },
        { a: "/categorias", texto: "Categorías", icono: LuTag, grupo: "Catálogo" },
        { a: "/fichas", texto: "Fichas", icono: LuLayoutTemplate },
        { a: "/servicios", texto: "Servicios", icono: LuLayoutGrid },
        { a: "/negocios", texto: "Negocios", icono: LuStore, grupo: "Negocios" },
        { a: "/avisos", texto: "Avisos", icono: LuMegaphone, grupo: "Comunicación" },
        { a: "/para-ti", texto: "Para ti", icono: LuNewspaper },
        { a: "/novedades", texto: "Novedades", icono: LuSparkles },
        { a: "/publicidad", texto: "Publicidad", icono: LuImage },
        { a: "/validacion", texto: "Validación", icono: LuBadgeCheck, grupo: "Validación", contador: pendientes },
        { a: "/cuentas", texto: "Cuentas", icono: LuKeyRound, grupo: "Personas" },
        { a: "/usuarios", texto: "Usuarios", icono: LuUsers },
      ];
    case "dueno_negocio":
      return [
        { a: "/mi-negocio", texto: "Información", icono: LuStore, grupo: "Mi negocio" },
        { a: "/mi-negocio/horario", texto: "Horario", icono: LuClock },
        { a: "/mi-negocio/fotos", texto: "Fotos", icono: LuImage },
        { a: "/mi-negocio/ofertas", texto: "Ofertas", icono: LuPercent },
        { a: "/mi-negocio/estado", texto: "Estado", icono: LuFlag },
      ];
    case "junta_vecinal":
      return [{ a: "/mis-avisos", texto: "Mis avisos", icono: LuMegaphone, grupo: "Comunicación" }];
    case "validador_contenido":
      return [
        { a: "/validacion", texto: "Cola de validación", icono: LuBadgeCheck, grupo: "Validación", contador: pendientes },
        { a: "/validacion/historial", texto: "Historial", icono: LuHistory },
      ];
    // Módulo de negocios completo (alta, edición, reenvío) pero nada más del panel; publicar es
    // del validador. El inicio cuenta los negocios rechazados que esperan corrección (0086).
    case "gestor_negocios":
      return [
        { a: "/inicio", texto: "Inicio", icono: LuHouse, grupo: "General", contador: rechazados },
        { a: "/negocios", texto: "Negocios", icono: LuStore, grupo: "Negocios" },
        { a: "/negocios/nuevo", texto: "Registrar negocio", icono: LuPlus },
      ];
    case "editor_redes":
      return itemsParaTi(reportados);
  }
}

const NOMBRE_ROL: Record<RolCuenta, string> = {
  super_admin: "Super-admin",
  dueno_negocio: "Dueño de negocio",
  junta_vecinal: "Junta vecinal",
  validador_contenido: "Validador de contenido",
  gestor_negocios: "Gestor de negocios",
  editor_redes: "Editor de redes sociales",
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
  const preferenciaTema = useTemaAdmin((estado) => estado.preferencia);
  const alternarTema = useTemaAdmin((estado) => estado.alternar);
  const oscuro = temaEfectivo(preferenciaTema) === "oscuro";
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const panel = usePanelActivo((e) => e.panel);
  const cambiarPanel = usePanelActivo((e) => e.cambiar);
  // Antes del return condicional de abajo: un hook después de él rompe el orden de hooks al
  // cerrar sesión (cuenta pasa a null).
  const rechazados = useNegocios((e) => e.negocios.filter((n) => !n.archivadoEn && n.estado === "inactivo" && n.motivoRechazo).length);
  const reportados = useParaTi((e) => e.resumenComentarios?.reportados ?? 0);
  const cargarResumenComentarios = useParaTi((e) => e.cargarResumenComentarios);
  const veParaTi = cuenta?.rol === "editor_redes" || (cuenta?.rol === "super_admin" && panel === "para-ti");

  // Comentarios reportados en el menú de Para ti (decisión 0092).
  useEffect(() => {
    if (token && veParaTi) cargarResumenComentarios(token);
  }, [token, veParaTi, cargarResumenComentarios, ubicacion.pathname]);

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
  const panelVisible = cuenta.rol === "super_admin" ? panel : "admin";

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
        <span className="marca-topbar-movil">ELISUR</span>
      </div>

      {menuAbierto ? (
        <div className="fondo-sidebar-movil" onClick={() => setMenuAbierto(false)} />
      ) : null}

      <aside className={`sidebar ${menuAbierto ? "abierto" : ""}`}>
        <div className="marca">
          <span>ELISUR</span>
          <small>Panel de administración</small>
        </div>
        {cuenta.rol === "dueno_negocio" ? <SelectorNegocioSidebar /> : null}
        {cuenta.rol === "super_admin" ? (
          <div className="selector-panel" role="tablist" aria-label="Panel">
            <button
              type="button"
              role="tab"
              aria-selected={panelVisible === "admin"}
              className={panelVisible === "admin" ? "activo" : ""}
              onClick={() => {
                cambiarPanel("admin");
                navegar("/dashboard");
              }}
            >
              Administración
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panelVisible === "para-ti"}
              className={panelVisible === "para-ti" ? "activo" : ""}
              onClick={() => {
                cambiarPanel("para-ti");
                navegar("/para-ti");
              }}
            >
              Para ti
            </button>
          </div>
        ) : null}
        <nav>
          {itemsPorRol(cuenta.rol, pendientes, rechazados, panelVisible, reportados).map((item) => (
            <Fragment key={item.a}>
              {item.grupo ? <span className="grupo-nav">{item.grupo}</span> : null}
              <NavLink
                to={item.a}
                end={item.a === "/mi-negocio" || item.a === "/negocios" || item.a === "/para-ti"}
                className={({ isActive }) => (isActive ? "activo" : undefined)}
              >
                <span className="izq">
                  <item.icono className="icono-nav" aria-hidden />
                  {item.texto}
                </span>
                {item.contador ? (
                  <span className="contador" aria-label={`${item.contador} pendientes`}>
                    {item.contador}
                  </span>
                ) : null}
              </NavLink>
            </Fragment>
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
        <button
          type="button"
          className="boton-tema"
          onClick={alternarTema}
          aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {oscuro ? <LuSun className="icono-nav" aria-hidden /> : <LuMoon className="icono-nav" aria-hidden />}
          {oscuro ? "Modo claro" : "Modo oscuro"}
        </button>
        <button className="cerrar-sesion" onClick={cerrarSesion}>
          <LuLogOut aria-hidden /> Cerrar sesión
        </button>
      </aside>
      <div className="contenido">
        <Outlet />
      </div>
      <PilaToasts />
    </div>
  );
}
