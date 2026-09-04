import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EstadoNegocio, Negocio } from "@app-vecinos/tipos";
import { useNegocios } from "../estado/useNegocios";
import { useGeografia } from "../estado/useGeografia";
import { useCuentas } from "../estado/useCuentas";
import { useCategorias } from "../estado/useCategorias";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { generarContrasenaTemporal } from "../utilidades/contrasena";
import { ModalContrasenaGenerada } from "../componentes/ModalContrasenaGenerada";
import { IconoCategoria } from "../componentes/IconoCategoria";

type FiltroEstado = "todos" | "activo" | "por_verificar" | "inactivo";

function pillEstado(estado: EstadoNegocio) {
  if (estado === "activo") return <span className="estado-negocio-pill activo">Activo</span>;
  if (estado === "por_verificar") return <span className="estado-negocio-pill verificar">Por verificar</span>;
  return <span className="estado-negocio-pill inactivo">Inactivo</span>;
}

interface PasswordPendiente {
  titulo: string;
  nombre: string;
  correo: string;
  contrasena: string;
}

export function Negocios() {
  const negociosMock = useNegocios((estado) => estado.negocios);
  const cargandoNegocios = useNegocios((estado) => estado.cargando);
  const errorNegocios = useNegocios((estado) => estado.error);
  const cargarNegocios = useNegocios((estado) => estado.cargarAdmin);
  const cargarMasNegocios = useNegocios((estado) => estado.cargarMasAdmin);
  const cursorSiguienteNegocios = useNegocios((estado) => estado.cursorSiguiente);
  const cargandoMasNegocios = useNegocios((estado) => estado.cargandoMas);
  const crearNegocio = useNegocios((estado) => estado.crear);
  const distritos = useGeografia((estado) => estado.distritos);
  const comunidades = useGeografia((estado) => estado.comunidades);
  const token = useSesionAdmin((estado) => estado.token)!;
  const cuentas = useCuentas((estado) => estado.cuentas);
  const cargarCuentas = useCuentas((estado) => estado.cargar);
  const crearCuenta = useCuentas((estado) => estado.crear);
  const agregarNegocio = useCuentas((estado) => estado.agregarNegocio);
  const categorias = useCategorias((estado) => estado.categorias);

  useEffect(() => {
    cargarCuentas(token);
    cargarNegocios(token);
  }, [cargarCuentas, cargarNegocios, token]);

  const [searchParams, setSearchParams] = useSearchParams();
  const comunidadIdFiltro = searchParams.get("comunidadId");

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("todos");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<Negocio | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [passwordPendiente, setPasswordPendiente] = useState<PasswordPendiente | null>(null);

  const categoriaPorId = useMemo(
    () => Object.fromEntries(categorias.map((c) => [c.id, c])),
    [categorias]
  );

  const comunidadFiltro = comunidadIdFiltro ? comunidades.find((c) => c.id === comunidadIdFiltro) : null;

  const negocios = negociosMock.filter((negocio) => {
    const coincideBusqueda = negocio.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = !categoriaId || negocio.categoriaIds.includes(categoriaId);
    const coincideComunidad = !comunidadIdFiltro || negocio.comunidadId === comunidadIdFiltro;
    const coincideEstado = estadoFiltro === "todos" || negocio.estado === estadoFiltro;
    return coincideBusqueda && coincideCategoria && coincideComunidad && coincideEstado;
  });

  const resumen = useMemo(() => {
    const activos = negociosMock.filter((n) => n.estado === "activo").length;
    return {
      total: negociosMock.length,
      activos,
      porVerificar: negociosMock.filter((n) => n.estado === "por_verificar").length,
      porcentajeVerificado: negociosMock.length ? Math.round((activos / negociosMock.length) * 100) : 0,
    };
  }, [negociosMock]);

  function duenoDe(negocioId: string) {
    return cuentas.find((c) => c.rol === "dueno_negocio" && c.negocioIds.includes(negocioId)) ?? null;
  }

  async function alCrearDueno(negocioId: string, nombre: string, correo: string) {
    const contrasena = generarContrasenaTemporal();
    const ok = await crearCuenta(
      { nombre, correo, rol: "dueno_negocio", negocioIds: [negocioId], distritosAsignados: [] },
      contrasena,
      token,
    );
    if (ok) setPasswordPendiente({ titulo: "Cuenta creada", nombre, correo, contrasena });
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Negocios</h2>
          <p>
            {resumen.total} negocios registrados · {negocios.length} mostrados
          </p>
        </div>
        <button className="btn btn-primario" onClick={() => setModalNuevo(true)}>
          ＋ Nuevo negocio
        </button>
      </div>

      {errorNegocios ? (
        <div className="nota-alerta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {errorNegocios}</span>
          <button className="btn-accion-mini" onClick={() => cargarNegocios(token)}>
            Reintentar
          </button>
        </div>
      ) : null}

      {cargandoNegocios && negociosMock.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Cargando negocios…
        </div>
      ) : (
      <>
      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>🏪</div>
          <div>
            <b>{resumen.total}</b>
            <span>Total negocios</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>✅</div>
          <div>
            <b>{resumen.activos}</b>
            <span>Activos</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--oro-suave)" }}>⏳</div>
          <div>
            <b>{resumen.porVerificar}</b>
            <span>Por verificar</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>📊</div>
          <div>
            <b>{resumen.porcentajeVerificado}%</b>
            <span>Verificados</span>
          </div>
        </div>
      </div>

      {comunidadFiltro ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12.5 }}>
          <span className="pill pill-azul">📍 {comunidadFiltro.nombre}</span>
          <button className="btn btn-fantasma" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setSearchParams({})}>
            Quitar filtro ✕
          </button>
        </div>
      ) : null}

      <div className="barra-filtros">
        <div className="buscador-mini">
          🔍
          <input placeholder="Buscar negocio…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="fila-filtro">
          <button className={`chip-filtro ${estadoFiltro === "todos" ? "activo" : ""}`} onClick={() => setEstadoFiltro("todos")}>
            Todos
          </button>
          <button
            className={`chip-filtro estado-activo ${estadoFiltro === "activo" ? "activo" : ""}`}
            onClick={() => setEstadoFiltro("activo")}
          >
            Activos
          </button>
          <button
            className={`chip-filtro estado-verificar ${estadoFiltro === "por_verificar" ? "activo" : ""}`}
            onClick={() => setEstadoFiltro("por_verificar")}
          >
            Por verificar
          </button>
          <button className={`chip-filtro ${estadoFiltro === "inactivo" ? "activo" : ""}`} onClick={() => setEstadoFiltro("inactivo")}>
            Inactivos
          </button>
        </div>
        <div className="fila-filtro">
          <button className={`chip-filtro ${categoriaId === null ? "activo" : ""}`} onClick={() => setCategoriaId(null)}>
            Todas las categorías
          </button>
          {categorias.slice(0, 6).map((cat) => (
            <button
              key={cat.id}
              className={`chip-filtro ${categoriaId === cat.id ? "activo" : ""}`}
              onClick={() => setCategoriaId(cat.id)}
            >
              <IconoCategoria nombre={cat.icono} size={13} /> {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="lista-negocios">
        {negocios.map((negocio) => (
          <div
            className={`fila-negocio ${negocioSeleccionado?.id === negocio.id ? "seleccionada" : ""}`}
            key={negocio.id}
            onClick={() => setNegocioSeleccionado(negocio)}
          >
            <div className="foto-negocio">🖼️</div>
            <div className="info-negocio">
              <div className="nombre-fila-neg">
                <b>{negocio.nombre}</b>
                {negocio.verificadoEn ? <span className="check-verificado">✓</span> : null}
              </div>
              <div className="direccion-neg">{negocio.direccion}</div>
            </div>
            <div className="cats-negocio">
              {negocio.categoriaIds.slice(0, 2).map((id) => (
                <span className="cat-tag" key={id}>
                  {categoriaPorId[id]?.nombre ?? id}
                </span>
              ))}
            </div>
            {pillEstado(negocio.estado)}
            <span className="flecha-fila">›</span>
          </div>
        ))}
        {negocios.length === 0 ? (
          <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
            No hay negocios que coincidan con el filtro.
          </div>
        ) : null}
      </div>
      {cursorSiguienteNegocios ? (
        <button
          className="btn-accion-mini"
          style={{ display: "block", margin: "16px auto 0" }}
          disabled={cargandoMasNegocios}
          onClick={() => cargarMasNegocios(token)}
        >
          {cargandoMasNegocios ? "Cargando…" : "Cargar más negocios"}
        </button>
      ) : null}
      </>
      )}

      {modalNuevo ? (
        <ModalNuevoNegocio
          distritos={distritos}
          comunidades={comunidades}
          categorias={categorias}
          onCancelar={() => setModalNuevo(false)}
          onCrear={async (datos, dueno) => {
            const id = await crearNegocio(datos, token);
            if (!id) return;
            setModalNuevo(false);
            if (dueno) alCrearDueno(id, dueno.nombre, dueno.correo);
          }}
        />
      ) : null}

      {negocioSeleccionado ? (
        <DrawerNegocio
          negocio={negocioSeleccionado}
          categoriaPorId={categoriaPorId}
          dueno={duenoDe(negocioSeleccionado.id)}
          cuentasDueno={cuentas.filter((c) => c.rol === "dueno_negocio")}
          onCerrar={() => setNegocioSeleccionado(null)}
          onCrearDueno={(nombre, correo) => alCrearDueno(negocioSeleccionado.id, nombre, correo)}
          onVincularDueno={(cuentaId) => agregarNegocio(cuentaId, negocioSeleccionado.id, token)}
        />
      ) : null}

      {passwordPendiente ? (
        <ModalContrasenaGenerada
          titulo={passwordPendiente.titulo}
          nombre={passwordPendiente.nombre}
          correo={passwordPendiente.correo}
          contrasena={passwordPendiente.contrasena}
          onCerrar={() => setPasswordPendiente(null)}
        />
      ) : null}
    </>
  );
}

function ModalNuevoNegocio({
  distritos,
  comunidades,
  categorias,
  onCancelar,
  onCrear,
}: {
  distritos: ReturnType<typeof useGeografia.getState>["distritos"];
  comunidades: ReturnType<typeof useGeografia.getState>["comunidades"];
  categorias: ReturnType<typeof useCategorias.getState>["categorias"];
  onCancelar: () => void;
  onCrear: (
    datos: {
      nombre: string;
      distritoUbigeo: string;
      comunidadId: string;
      categoriaIds: string[];
      direccion: string;
      telefono: string | null;
      whatsapp: string | null;
    },
    dueno: { nombre: string; correo: string } | null
  ) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [distritoUbigeo, setDistritoUbigeo] = useState(distritos[0]?.ubigeo ?? "");
  const comunidadesDelDistrito = comunidades.filter((c) => c.distritoUbigeo === distritoUbigeo);
  const [comunidadId, setComunidadId] = useState(comunidadesDelDistrito[0]?.id ?? "");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [crearDueno, setCrearDueno] = useState(false);
  const [nombreDueno, setNombreDueno] = useState("");
  const [correoDueno, setCorreoDueno] = useState("");

  function alCambiarDistrito(nuevoUbigeo: string) {
    setDistritoUbigeo(nuevoUbigeo);
    const primeraComunidad = comunidades.find((c) => c.distritoUbigeo === nuevoUbigeo);
    setComunidadId(primeraComunidad?.id ?? "");
  }

  const valido =
    nombre.trim() &&
    distritoUbigeo &&
    comunidadId &&
    categoriaId &&
    direccion.trim() &&
    (!crearDueno || (nombreDueno.trim() && correoDueno.trim()));

  function confirmar() {
    if (!valido) return;
    onCrear(
      {
        nombre: nombre.trim(),
        distritoUbigeo,
        comunidadId,
        categoriaIds: [categoriaId],
        direccion: direccion.trim(),
        telefono: telefono.trim() || null,
        whatsapp: whatsapp.trim() || null,
      },
      crearDueno ? { nombre: nombreDueno.trim(), correo: correoDueno.trim() } : null
    );
  }

  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo negocio</h3>
        <p className="sub">Alta rápida — la ficha completa (fotos, horario, descripción) se termina de llenar después.</p>

        <div className="campo-modal">
          <label>Nombre del negocio</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Panadería San José" autoFocus />
        </div>

        <div className="campo-modal">
          <label>Distrito</label>
          <select value={distritoUbigeo} onChange={(e) => alCambiarDistrito(e.target.value)}>
            {distritos.map((d) => (
              <option key={d.ubigeo} value={d.ubigeo}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-modal">
          <label>Comunidad</label>
          <select value={comunidadId} onChange={(e) => setComunidadId(e.target.value)}>
            {comunidadesDelDistrito.length === 0 ? <option value="">Sin comunidades en este distrito</option> : null}
            {comunidadesDelDistrito.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-modal">
          <label>Categoría</label>
          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-modal">
          <label>Dirección</label>
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej. Av. Aviación 2400" />
        </div>

        <div className="campo-modal">
          <label>Teléfono (opcional)</label>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 01 234 5678" />
        </div>

        <div className="campo-modal">
          <label>WhatsApp (opcional)</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej. 987654321" />
        </div>

        <div className="toggle-dueno" onClick={() => setCrearDueno((v) => !v)}>
          <div className={`switch ${crearDueno ? "" : "off"}`}>
            <i />
          </div>
          <div>
            <b>Crear cuenta de dueño ahora</b>
            <span>La persona podrá entrar a administrar su ficha con una clave temporal</span>
          </div>
        </div>

        {crearDueno ? (
          <div className="seccion-dueno-inline">
            <div className="campo-modal">
              <label>Nombre del dueño</label>
              <input value={nombreDueno} onChange={(e) => setNombreDueno(e.target.value)} placeholder="Nombre completo" />
            </div>
            <div className="campo-modal" style={{ marginBottom: 0 }}>
              <label>Correo</label>
              <input value={correoDueno} onChange={(e) => setCorreoDueno(e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
          </div>
        ) : null}

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-crear" disabled={!valido} onClick={confirmar}>
            Crear negocio
          </button>
        </div>
      </div>
    </div>
  );
}

function DrawerNegocio({
  negocio,
  categoriaPorId,
  dueno,
  cuentasDueno,
  onCerrar,
  onCrearDueno,
  onVincularDueno,
}: {
  negocio: Negocio;
  categoriaPorId: Record<string, { nombre: string; icono: string }>;
  dueno: ReturnType<typeof useCuentas.getState>["cuentas"][number] | null;
  cuentasDueno: ReturnType<typeof useCuentas.getState>["cuentas"];
  onCerrar: () => void;
  onCrearDueno: (nombre: string, correo: string) => void;
  onVincularDueno: (cuentaId: string) => void;
}) {
  const [modoAsignacion, setModoAsignacion] = useState<"ninguno" | "crear" | "vincular">("ninguno");
  const [nombreDueno, setNombreDueno] = useState("");
  const [correoDueno, setCorreoDueno] = useState("");
  const [cuentaAVincular, setCuentaAVincular] = useState("");

  function confirmarDueno() {
    if (!nombreDueno.trim() || !correoDueno.trim()) return;
    onCrearDueno(nombreDueno.trim(), correoDueno.trim());
    setModoAsignacion("ninguno");
    setNombreDueno("");
    setCorreoDueno("");
  }

  function confirmarVinculo() {
    if (!cuentaAVincular) return;
    onVincularDueno(cuentaAVincular);
    setModoAsignacion("ninguno");
    setCuentaAVincular("");
  }

  return (
    <>
      <div className="fondo-drawer" onClick={onCerrar} />
      <div className="drawer">
        <div className="drawer-cierre">
          <button onClick={onCerrar} type="button">✕</button>
        </div>

        <div className="drawer-foto">🖼️</div>
        <div className="drawer-titulo">
          <b>{negocio.nombre}</b>
        </div>
        <p className="drawer-desc">{negocio.descripcion || "Sin descripción todavía."}</p>

        {negocio.estado === "por_verificar" ? (
          <div className="aviso-pendiente-drawer">⏳ Este negocio está esperando validación de contenido.</div>
        ) : null}
        {negocio.motivoRechazo ? (
          <div className="aviso-rechazo-drawer">✕ Último rechazo: {negocio.motivoRechazo}</div>
        ) : null}

        <div className="drawer-seccion">
          <div className="etiqueta">Dueño del negocio</div>
          {dueno ? (
            <div className="drawer-dueno-card">
              <div className="avatar-dueno">👤</div>
              <div>
                <b>{dueno.nombre}</b>
                <span>{dueno.correo}</span>
              </div>
            </div>
          ) : (
            <div className="drawer-sin-dueno">
              <p>Este negocio todavía no tiene una cuenta de dueño vinculada.</p>

              {modoAsignacion === "crear" ? (
                <div className="form-inline-dueno">
                  <input
                    autoFocus
                    placeholder="Nombre del dueño"
                    value={nombreDueno}
                    onChange={(e) => setNombreDueno(e.target.value)}
                  />
                  <input
                    placeholder="Correo"
                    value={correoDueno}
                    onChange={(e) => setCorreoDueno(e.target.value)}
                  />
                  <div className="fila-botones-inline">
                    <button
                      style={{ background: "var(--coral)", color: "#fff" }}
                      onClick={confirmarDueno}
                      type="button"
                    >
                      Crear cuenta
                    </button>
                    <button
                      style={{ background: "var(--superficie-hundida)", color: "var(--texto-suave)" }}
                      onClick={() => setModoAsignacion("ninguno")}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : modoAsignacion === "vincular" ? (
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
                      onClick={confirmarVinculo}
                      disabled={!cuentaAVincular}
                      type="button"
                    >
                      Vincular
                    </button>
                    <button
                      style={{ background: "var(--superficie-hundida)", color: "var(--texto-suave)" }}
                      onClick={() => setModoAsignacion("ninguno")}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="fila-botones-inline">
                  <button className="btn-crear-dueno" onClick={() => setModoAsignacion("crear")} type="button">
                    ＋ Crear cuenta nueva
                  </button>
                  <button
                    className="btn-crear-dueno"
                    style={{ background: "var(--azul)" }}
                    onClick={() => setModoAsignacion("vincular")}
                    type="button"
                  >
                    🔗 Vincular existente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="drawer-seccion">
          <div className="etiqueta">Detalles</div>
          <div className="drawer-fila-dato">
            <span className="icono-dato">📍</span>
            {negocio.direccion}
          </div>
          <div className="drawer-fila-dato">
            <span className="icono-dato">🏷️</span>
            {negocio.categoriaIds.map((id) => categoriaPorId[id]?.nombre ?? id).join(", ") || "Sin categoría"}
          </div>
          <div className="drawer-fila-dato">
            <span className="icono-dato">📞</span>
            {negocio.telefono || "Sin teléfono"}
          </div>
          <div className="drawer-fila-dato">
            <span className="icono-dato">💬</span>
            {negocio.whatsapp || "Sin WhatsApp"}
          </div>
        </div>

        <div className="drawer-acciones">
          {negocio.estado === "por_verificar" ? (
            <Link className="btn-drawer-validacion" to="/validacion">
              Ir a Cola de validación →
            </Link>
          ) : null}
          <button
            className="btn-drawer-primario"
            disabled
            title="El editor completo de ficha (horario, fotos, ofertas) todavía no está construido"
            style={{ opacity: 0.55, cursor: "not-allowed" }}
          >
            Editar ficha completa → (próximamente)
          </button>
        </div>
      </div>
    </>
  );
}
