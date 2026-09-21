import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Negocio } from "@app-vecinos/tipos";
import { useNegocios } from "../estado/useNegocios";
import { useCuentas } from "../estado/useCuentas";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { generarContrasenaTemporal } from "../utilidades/contrasena";
import { ModalContrasenaGenerada } from "../componentes/ModalContrasenaGenerada";
import { EditorInfoNegocio } from "../componentes/negocio/EditorInfoNegocio";
import { EditorHorarioNegocio } from "../componentes/negocio/EditorHorarioNegocio";
import { EditorFotosNegocio } from "../componentes/negocio/EditorFotosNegocio";
import { EditorProductosNegocio } from "../componentes/negocio/EditorProductosNegocio";
import { EditorOfertasNegocio } from "../componentes/negocio/EditorOfertasNegocio";
import { EditorEstadoNegocio } from "../componentes/negocio/EditorEstadoNegocio";
import { urlCompleta } from "../utilidades/media";

type Pestana = "info" | "horario" | "fotos" | "productos" | "ofertas" | "dueno" | "estado";

const PESTANAS: { id: Pestana; icono: string; texto: string }[] = [
  { id: "info", icono: "📋", texto: "Información" },
  { id: "horario", icono: "🕒", texto: "Horario" },
  { id: "fotos", icono: "📷", texto: "Fotos" },
  { id: "productos", icono: "🍽️", texto: "Productos" },
  { id: "ofertas", icono: "🏷️", texto: "Ofertas" },
  { id: "dueno", icono: "👤", texto: "Dueño" },
  { id: "estado", icono: "✅", texto: "Estado" },
];

function pillEstado(estado: Negocio["estado"]) {
  if (estado === "activo") return <span className="estado-negocio-pill activo">Activo</span>;
  if (estado === "por_verificar") return <span className="estado-negocio-pill verificar">Sin publicar</span>;
  return <span className="estado-negocio-pill inactivo">Inactivo</span>;
}

/**
 * Ficha completa de un negocio en el panel: el mismo negocio visto por todas sus caras, en vez
 * del panel lateral de solo lectura que había antes (donde "Editar ficha completa" estaba
 * deshabilitado). Reutiliza los editores de "Mi negocio" — el dueño y el admin editan con el
 * mismo formulario.
 */
export function FichaNegocio() {
  const { id = "" } = useParams();
  const token = useSesionAdmin((estado) => estado.token)!;
  const negocios = useNegocios((estado) => estado.negocios);
  const cargarUno = useNegocios((estado) => estado.cargarUno);
  const [buscando, setBuscando] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const pestanaUrl = searchParams.get("tab") as Pestana | null;
  const pestana: Pestana = PESTANAS.some((p) => p.id === pestanaUrl) ? (pestanaUrl as Pestana) : "info";
  const negocio = negocios.find((n) => n.id === id) ?? null;

  useEffect(() => {
    // Se pide siempre al servidor aunque ya esté en la lista: abrir la ficha es el momento de
    // tener los datos frescos (puede llevar rato abierta la pestaña del listado).
    setBuscando(true);
    cargarUno(id, token).finally(() => setBuscando(false));
  }, [id, token, cargarUno]);

  if (!negocio) {
    return (
      <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
        {buscando ? "Cargando negocio…" : "No encontramos este negocio."}
      </div>
    );
  }

  return (
    <>
      <div style={{ fontSize: 12, marginBottom: 10 }}>
        <Link to="/negocios" style={{ color: "var(--texto-suave)", textDecoration: "none" }}>
          ← Negocios
        </Link>
        <span style={{ color: "var(--texto-tenue)" }}> / {negocio.nombre}</span>
      </div>

      <div className="topbar">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="foto-negocio" style={{ width: 52, height: 52, flexShrink: 0 }}>
            {negocio.fotoPrincipalUrl ? (
              <img
                src={urlCompleta(negocio.fotoPrincipalUrl)}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
              />
            ) : (
              "🖼️"
            )}
          </div>
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {negocio.nombre} {pillEstado(negocio.estado)}
            </h2>
            <p>{negocio.direccion}</p>
          </div>
        </div>
      </div>

      <div className="tabs-negocio">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`tab-negocio ${pestana === p.id ? "activo" : ""}`}
            onClick={() => setSearchParams(p.id === "info" ? {} : { tab: p.id })}
          >
            {p.icono} {p.texto}
          </button>
        ))}
      </div>

      {pestana === "info" ? <EditorInfoNegocio key={negocio.id} negocio={negocio} /> : null}
      {pestana === "horario" ? <EditorHorarioNegocio key={negocio.id} negocio={negocio} /> : null}
      {pestana === "fotos" ? <EditorFotosNegocio key={negocio.id} negocio={negocio} /> : null}
      {pestana === "productos" ? <EditorProductosNegocio key={negocio.id} negocio={negocio} /> : null}
      {pestana === "ofertas" ? <EditorOfertasNegocio key={negocio.id} negocio={negocio} /> : null}
      {pestana === "dueno" ? <PestanaDueno negocio={negocio} /> : null}
      {pestana === "estado" ? <PestanaEstado negocio={negocio} /> : null}
    </>
  );
}

function PestanaEstado({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const aprobar = useNegocios((estado) => estado.aprobar);
  const despublicar = useNegocios((estado) => estado.despublicar);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  async function ejecutar(accion: () => Promise<void>) {
    setTrabajando(true);
    await accion();
    setTrabajando(false);
    setConfirmandoBaja(false);
  }

  return (
    <EditorEstadoNegocio
      negocio={negocio}
      acciones={
        negocio.estado === "activo" ? (
          confirmandoBaja ? (
            <>
              <span style={{ fontSize: 12, color: "var(--texto-suave)", flex: 1 }}>
                ¿Bajar "{negocio.nombre}" de la app? Deja de aparecer en Buscar y su ficha no se puede abrir.
                Nada se borra: puedes volver a publicarlo cuando quieras.
              </span>
              <button
                className="btn btn-primario"
                style={{ background: "var(--rojo)" }}
                disabled={trabajando}
                onClick={() => ejecutar(() => despublicar(negocio.id, token))}
              >
                {trabajando ? "Bajando…" : "Sí, despublicar"}
              </button>
              <button className="btn btn-fantasma" onClick={() => setConfirmandoBaja(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, color: "var(--texto-suave)", flex: 1 }}>
                La ficha está publicada. Cualquier cambio que hagas se ve en la app de inmediato.
              </span>
              <button className="btn btn-fantasma" onClick={() => setConfirmandoBaja(true)}>
                Despublicar
              </button>
            </>
          )
        ) : (
          <>
            <button
              className="btn btn-primario"
              disabled={trabajando}
              onClick={() => ejecutar(() => aprobar(negocio.id, token))}
            >
              {trabajando ? "Publicando…" : "Publicar en la app"}
            </button>
            <span style={{ fontSize: 12, color: "var(--texto-suave)" }}>
              Desde ese momento los vecinos pueden encontrarlo.
            </span>
          </>
        )
      }
    />
  );
}

function PestanaDueno({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const cuentas = useCuentas((estado) => estado.cuentas);
  const cargarCuentas = useCuentas((estado) => estado.cargar);
  const crearCuenta = useCuentas((estado) => estado.crear);
  const agregarNegocio = useCuentas((estado) => estado.agregarNegocio);

  const [modo, setModo] = useState<"ninguno" | "crear" | "vincular">("ninguno");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [cuentaAVincular, setCuentaAVincular] = useState("");
  const [password, setPassword] = useState<{ nombre: string; correo: string; contrasena: string } | null>(null);

  useEffect(() => {
    cargarCuentas(token);
  }, [cargarCuentas, token]);

  const dueno = cuentas.find((c) => c.rol === "dueno_negocio" && c.negocioIds.includes(negocio.id)) ?? null;
  const cuentasDueno = cuentas.filter((c) => c.rol === "dueno_negocio");

  async function confirmarCrear() {
    if (!nombre.trim() || !correo.trim()) return;
    const contrasena = generarContrasenaTemporal();
    const ok = await crearCuenta(
      { nombre: nombre.trim(), correo: correo.trim(), rol: "dueno_negocio", negocioIds: [negocio.id], distritosAsignados: [] },
      contrasena,
      token,
    );
    if (ok) {
      setPassword({ nombre: nombre.trim(), correo: correo.trim(), contrasena });
      setModo("ninguno");
      setNombre("");
      setCorreo("");
    }
  }

  return (
    <div className="tarjeta">
      <p style={{ fontSize: 11.5, color: "var(--texto-suave)", margin: "0 0 14px" }}>
        El dueño administra su propia ficha desde su cuenta: información, horario, fotos, productos y ofertas.
      </p>

      {dueno ? (
        <div className="drawer-dueno-card">
          <div className="avatar-dueno">👤</div>
          <div>
            <b>{dueno.nombre}</b>
            <span>{dueno.correo}</span>
          </div>
        </div>
      ) : modo === "crear" ? (
        <div className="form-inline-dueno">
          <input autoFocus placeholder="Nombre del dueño" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <div className="fila-botones-inline">
            <button style={{ background: "var(--coral)", color: "#fff" }} onClick={confirmarCrear} type="button">
              Crear cuenta
            </button>
            <button
              style={{ background: "var(--superficie-hundida)", color: "var(--texto-suave)" }}
              onClick={() => setModo("ninguno")}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : modo === "vincular" ? (
        <div className="form-inline-dueno">
          {cuentasDueno.length === 0 ? (
            <p style={{ fontSize: 11, color: "var(--coral-fuerte)", margin: 0 }}>
              Todavía no hay ninguna cuenta con rol "Dueño de negocio" creada.
            </p>
          ) : (
            <select value={cuentaAVincular} onChange={(e) => setCuentaAVincular(e.target.value)} autoFocus>
              <option value="">— seleccionar cuenta —</option>
              {cuentasDueno.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.correo}){c.negocioIds.length > 0 ? ` — ya administra ${c.negocioIds.length}` : ""}
                </option>
              ))}
            </select>
          )}
          <div className="fila-botones-inline">
            <button
              style={{ background: "var(--coral)", color: "#fff" }}
              disabled={!cuentaAVincular}
              onClick={() => {
                agregarNegocio(cuentaAVincular, negocio.id, token);
                setModo("ninguno");
                setCuentaAVincular("");
              }}
              type="button"
            >
              Vincular
            </button>
            <button
              style={{ background: "var(--superficie-hundida)", color: "var(--texto-suave)" }}
              onClick={() => setModo("ninguno")}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="drawer-sin-dueno">
          <p>Este negocio todavía no tiene una cuenta de dueño vinculada.</p>
          <div className="fila-botones-inline">
            <button className="btn-crear-dueno" onClick={() => setModo("crear")} type="button">
              ＋ Crear cuenta nueva
            </button>
            <button
              className="btn-crear-dueno"
              style={{ background: "var(--azul)" }}
              onClick={() => setModo("vincular")}
              type="button"
            >
              🔗 Vincular existente
            </button>
          </div>
        </div>
      )}

      {password ? (
        <ModalContrasenaGenerada
          titulo="Cuenta creada"
          nombre={password.nombre}
          correo={password.correo}
          contrasena={password.contrasena}
          onCerrar={() => setPassword(null)}
        />
      ) : null}
    </div>
  );
}
