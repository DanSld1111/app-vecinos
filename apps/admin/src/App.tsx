import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSesionAdmin } from "./estado/useSesionAdmin";
import { LayoutAdmin } from "./componentes/LayoutAdmin";
import { Login } from "./paginas/Login";
import { Dashboard } from "./paginas/Dashboard";
import { Negocios } from "./paginas/Negocios";
import { RegistrarNegocio } from "./paginas/RegistrarNegocio";
import { FichaNegocio } from "./paginas/FichaNegocio";
import { Servicios } from "./paginas/Servicios";
import { ColaValidacion } from "./paginas/ColaValidacion";
import { HistorialValidaciones } from "./paginas/HistorialValidaciones";
import { Distritos } from "./paginas/Distritos";
import { Categorias } from "./paginas/Categorias";
import { Fichas } from "./paginas/Fichas";
import { InicioGestor } from "./paginas/InicioGestor";
import { alertaInfo } from "./estado/useToasts";
import { RolCuenta } from "@app-vecinos/tipos";
import { Publicidad } from "./paginas/Publicidad";
import { Novedades } from "./paginas/Novedades";
import { Avisos } from "./paginas/Avisos";
import { Cuentas } from "./paginas/Cuentas";
import { Usuarios } from "./paginas/Usuarios";
import { MisNegocios } from "./paginas/MisNegocios";
import { MiNegocio } from "./paginas/MiNegocio";
import { MiNegocioHorario } from "./paginas/MiNegocioHorario";
import { MiNegocioProductos } from "./paginas/MiNegocioProductos";
import { MiNegocioFotos } from "./paginas/MiNegocioFotos";
import { MiNegocioOfertas } from "./paginas/MiNegocioOfertas";
import { MiNegocioPasillos, MiNegocioRubros, MiNegocioServicios } from "./paginas/MiNegocioContenido";
import { MiNegocioEstado } from "./paginas/MiNegocioEstado";
import { MisAvisos } from "./paginas/MisAvisos";
import { MiCuenta } from "./paginas/MiCuenta";

/**
 * Qué secciones del panel abre cada rol (decisión 0086). Antes cualquier cuenta abría cualquier
 * dirección escribiéndola a mano: la API la bloqueaba, pero se veía una pantalla vacía con error.
 * super_admin no está: entra a todo.
 */
const ACCESO: Record<Exclude<RolCuenta, "super_admin">, string[]> = {
  gestor_negocios: ["/inicio", "/negocios"],
  dueno_negocio: ["/mis-negocios", "/mi-negocio"],
  junta_vecinal: ["/mis-avisos"],
  validador_contenido: ["/validacion"],
};

function permitido(rol: RolCuenta, ruta: string): boolean {
  if (rol === "super_admin" || ruta === "/" || ruta === "/mi-cuenta") return true;
  return ACCESO[rol].some((p) => ruta === p || ruta.startsWith(`${p}/`));
}

function RutaProtegida({ children }: { children: React.ReactNode }) {
  const cuenta = useSesionAdmin((estado) => estado.cuenta);
  const { pathname } = useLocation();
  const bloqueada = Boolean(cuenta) && !permitido(cuenta!.rol, pathname);
  useEffect(() => {
    if (bloqueada) alertaInfo("Esa sección no está disponible para tu rol", "Te llevamos a tu inicio.");
  }, [bloqueada, pathname]);
  if (!cuenta) return <Navigate to="/login" replace />;
  if (bloqueada) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RutaInicial() {
  const cuenta = useSesionAdmin((estado) => estado.cuenta);
  if (!cuenta) return <Navigate to="/login" replace />;
  switch (cuenta.rol) {
    case "super_admin":
      return <Navigate to="/dashboard" replace />;
    case "dueno_negocio":
      return <Navigate to={cuenta.negocioIds.length > 1 ? "/mis-negocios" : "/mi-negocio"} replace />;
    case "junta_vecinal":
      return <Navigate to="/mis-avisos" replace />;
    case "validador_contenido":
      return <Navigate to="/validacion" replace />;
    case "gestor_negocios":
      return <Navigate to="/inicio" replace />;
  }
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RutaProtegida>
            <LayoutAdmin />
          </RutaProtegida>
        }
      >
        <Route path="/" element={<RutaInicial />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inicio" element={<InicioGestor />} />
        <Route path="/negocios" element={<Negocios />} />
        <Route path="/negocios/nuevo" element={<RegistrarNegocio />} />
        <Route path="/negocios/:id" element={<FichaNegocio />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/distritos" element={<Distritos />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/fichas" element={<Fichas />} />
        {/* Plantillas y Arquetipos se juntaron en Fichas (decisión 0080): los enlaces viejos llevan ahí. */}
        <Route path="/plantillas" element={<Navigate to="/fichas" replace />} />
        <Route path="/arquetipos" element={<Navigate to="/fichas" replace />} />
        <Route path="/publicidad" element={<Publicidad />} />
        <Route path="/novedades" element={<Novedades />} />
        <Route path="/avisos" element={<Avisos />} />
        <Route path="/validacion" element={<ColaValidacion />} />
        <Route path="/validacion/historial" element={<HistorialValidaciones />} />
        <Route path="/cuentas" element={<Cuentas />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/mis-negocios" element={<MisNegocios />} />
        <Route path="/mi-negocio" element={<MiNegocio />} />
        <Route path="/mi-negocio/horario" element={<MiNegocioHorario />} />
        <Route path="/mi-negocio/fotos" element={<MiNegocioFotos />} />
        <Route path="/mi-negocio/productos" element={<MiNegocioProductos />} />
        <Route path="/mi-negocio/servicios" element={<MiNegocioServicios />} />
        <Route path="/mi-negocio/rubros" element={<MiNegocioRubros />} />
        <Route path="/mi-negocio/ofertas" element={<MiNegocioOfertas />} />
        <Route path="/mi-negocio/pasillos" element={<MiNegocioPasillos />} />
        <Route path="/mi-negocio/estado" element={<MiNegocioEstado />} />
        <Route path="/mis-avisos" element={<MisAvisos />} />
        <Route path="/mi-cuenta" element={<MiCuenta />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
