import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LuMegaphone, LuStar } from "react-icons/lu";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { avisarErrorParaTi, useParaTi } from "../estado/useParaTi";
import { alertaExito } from "../estado/useToasts";

const MODULOS = [
  {
    clave: "para_ti" as const,
    campo: "paraTi" as const,
    nombre: "Para ti",
    icono: LuStar,
    descripcion: "Publicaciones con fotos, videos, enlaces de YouTube y destacadas. Las ven todos los distritos.",
  },
  {
    clave: "comunidad" as const,
    campo: "comunidad" as const,
    nombre: "Comunidad",
    icono: LuMegaphone,
    descripcion: "Avisos de la junta vecinal y la municipalidad, por distrito.",
  },
];

/** Encender o apagar pestañas de la app (decisión 0091). Solo super admin. */
export function ModulosApp() {
  const token = useSesionAdmin((e) => e.token)!;
  const { modulos, cargarModulos, cambiarModulo } = useParaTi();

  useEffect(() => {
    cargarModulos();
  }, [cargarModulos]);

  return (
    <div className="para-ti-admin">
      <div className="topbar">
        <div>
          <h2>Módulos de la app</h2>
          <p>Apaga una pestaña para que los vecinos no la vean. Nada se borra: al encenderla vuelve tal como estaba.</p>
        </div>
      </div>
      {!modulos ? <p className="vacio-editor">Cargando…</p> : null}
      <div className="lista-modulos">
        {modulos
          ? MODULOS.map((m) => {
              const activo = modulos[m.campo];
              return (
                <section className={`tarjeta-modulo ${activo ? "activo" : ""}`} key={m.clave}>
                  <span className="icono-modulo" aria-hidden>
                    <m.icono />
                  </span>
                  <div>
                    <div className="titulo-modulo">
                      <b>{m.nombre}</b>
                      <span className={`chip-estado ${activo ? "publicada" : "borrador"}`}>{activo ? "Visible en la app" : "Oculto"}</span>
                    </div>
                    <p>{m.descripcion}</p>
                    <small>{activo ? "Los vecinos ven esta pestaña." : "Nadie ve esta pestaña. Puedes preparar contenido antes de encenderla."}</small>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={activo}
                    aria-label={`${activo ? "Apagar" : "Encender"} ${m.nombre}`}
                    className={`interruptor grande ${activo ? "encendido" : ""}`}
                    onClick={async () => {
                      if (await cambiarModulo(m.clave, !activo, token)) alertaExito(`${m.nombre} ${activo ? "apagado" : "encendido"}`, "Los vecinos lo verán al abrir la app.");
                      else avisarErrorParaTi("No se pudo cambiar");
                    }}
                  >
                    <i />
                  </button>
                </section>
              );
            })
          : null}
      </div>
      <p className="ayuda-modal">
        Inicio, Servicios y Perfil no se pueden apagar. Los servicios de la pestaña Servicios se activan uno por uno en <Link to="/servicios">Servicios</Link>.
      </p>
    </div>
  );
}
