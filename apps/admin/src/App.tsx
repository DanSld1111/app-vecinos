import { Navigate, Route, Routes } from "react-router-dom";
import { useSesionAdmin } from "./estado/useSesionAdmin";
import { LayoutAdmin } from "./componentes/LayoutAdmin";
import { Login } from "./paginas/Login";
import { Dashboard } from "./paginas/Dashboard";
import { Negocios } from "./paginas/Negocios";
import { FichaNegocio } from "./paginas/FichaNegocio";
import { Servicios } from "./paginas/Servicios";
import { ColaValidacion } from "./paginas/ColaValidacion";
import { HistorialValidaciones } from "./paginas/HistorialValidaciones";
import { Distritos } from "./paginas/Distritos";
import { Categorias } from "./paginas/Categorias";
import { Plantillas } from "./paginas/Plantillas";
import { Arquetipos } from "./paginas/Arquetipos";
import { Publicidad } from "./paginas/Publicidad";
import { Novedades } from "./paginas/Novedades";
import { Avisos } from "./paginas/Avisos";
import { Cuentas } from "./paginas/Cuentas";
import { Usuarios } from "./paginas/Usuarios";
import { MisNegocios } from "./paginas/MisNegocios";
import { MiNegocio } from "./paginas/MiNegocio";
import { MiNegocioHorario } from "./paginas/MiNegocioHorario";
import { MiNegocioFotos } from "./paginas/MiNegocioFotos";
import { MiNegocioOfertas } from "./paginas/MiNegocioOfertas";
import { MiNegocioEstado } from "./paginas/MiNegocioEstado";
import { MisAvisos } from "./paginas/MisAvisos";
import { MiCuenta } from "./paginas/MiCuenta";

function RutaProtegida({ children }: { children: React.ReactNode }) {
  const cuenta = useSesionAdmin((estado) => estado.cuenta);
  if (!cuenta) return <Navigate to="/login" replace />;
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
        <Route path="/negocios" element={<Negocios />} />
        <Route path="/negocios/:id" element={<FichaNegocio />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/distritos" element={<Distritos />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/plantillas" element={<Plantillas />} />
        <Route path="/arquetipos" element={<Arquetipos />} />
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
        <Route path="/mi-negocio/ofertas" element={<MiNegocioOfertas />} />
        <Route path="/mi-negocio/estado" element={<MiNegocioEstado />} />
        <Route path="/mis-avisos" element={<MisAvisos />} />
        <Route path="/mi-cuenta" element={<MiCuenta />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
