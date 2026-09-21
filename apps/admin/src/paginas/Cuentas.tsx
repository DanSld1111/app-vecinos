import { useEffect, useMemo, useState } from "react";
import { Cuenta, RolCuenta } from "@app-vecinos/tipos";
import { useCuentas } from "../estado/useCuentas";
import { useNegocios } from "../estado/useNegocios";
import { useGeografia } from "../estado/useGeografia";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { generarContrasenaTemporal } from "../utilidades/contrasena";
import { ModalContrasenaGenerada } from "../componentes/ModalContrasenaGenerada";

const NOMBRE_ROL: Record<RolCuenta, string> = {
  super_admin: "Super-admin",
  dueno_negocio: "Dueño de negocio",
  junta_vecinal: "Junta vecinal",
  validador_contenido: "Validador",
  gestor_negocios: "Gestor de negocios",
};

const COLOR_ROL: Record<RolCuenta, string> = {
  super_admin: "#2b2f27",
  dueno_negocio: "var(--verde)",
  junta_vecinal: "var(--azul)",
  validador_contenido: "var(--coral)",
  gestor_negocios: "var(--morado)",
};

const COLOR_ROL_SUAVE: Record<RolCuenta, string> = {
  super_admin: "#2b2f27",
  dueno_negocio: "var(--verde-suave)",
  junta_vecinal: "var(--azul-suave)",
  validador_contenido: "var(--coral-suave)",
  gestor_negocios: "var(--morado-suave)",
};

const COLOR_ROL_TEXTO: Record<RolCuenta, string> = {
  super_admin: "#fff",
  dueno_negocio: "var(--verde-fuerte)",
  junta_vecinal: "var(--azul)",
  validador_contenido: "var(--coral-fuerte)",
  gestor_negocios: "var(--morado)",
};

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

type FiltroRol = "todos" | RolCuenta;

interface PasswordPendiente {
  titulo: string;
  nombre: string;
  correo: string;
  contrasena: string;
}

export function Cuentas() {
  const token = useSesionAdmin((estado) => estado.token)!;
  const cuentas = useCuentas((estado) => estado.cuentas);
  const cargandoCuentas = useCuentas((estado) => estado.cargando);
  const errorCuentas = useCuentas((estado) => estado.error);
  const cargar = useCuentas((estado) => estado.cargar);
  const cargarMas = useCuentas((estado) => estado.cargarMas);
  const cursorSiguiente = useCuentas((estado) => estado.cursorSiguiente);
  const cargandoMas = useCuentas((estado) => estado.cargandoMas);
  const crear = useCuentas((estado) => estado.crear);
  const actualizar = useCuentas((estado) => estado.actualizar);
  const eliminar = useCuentas((estado) => estado.eliminar);
  const alternarActivo = useCuentas((estado) => estado.alternarActivo);
  const agregarNegocio = useCuentas((estado) => estado.agregarNegocio);
  const quitarNegocio = useCuentas((estado) => estado.quitarNegocio);
  const restablecerClave = useCuentas((estado) => estado.restablecerClave);
  const negocios = useNegocios((estado) => estado.negocios);
  const distritos = useGeografia((estado) => estado.distritos);

  useEffect(() => {
    cargar(token);
  }, [cargar, token]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState<string | null>(null);
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);
  const [confirmandoResetearId, setConfirmandoResetearId] = useState<string | null>(null);
  const [reseteandoClave, setReseteandoClave] = useState(false);
  const [passwordPendiente, setPasswordPendiente] = useState<PasswordPendiente | null>(null);

  const cuentaSeleccionada = cuentas.find((c) => c.id === cuentaSeleccionadaId) ?? null;
  const confirmandoEliminar = cuentas.find((c) => c.id === confirmandoEliminarId) ?? null;
  const confirmandoResetear = cuentas.find((c) => c.id === confirmandoResetearId) ?? null;

  const negocioPorId = useMemo(() => Object.fromEntries(negocios.map((n) => [n.id, n])), [negocios]);

  const resumen = useMemo(
    () => ({
      total: cuentas.length,
      activas: cuentas.filter((c) => c.activo).length,
      duenos: cuentas.filter((c) => c.rol === "dueno_negocio").length,
      juntas: cuentas.filter((c) => c.rol === "junta_vecinal").length,
      validadores: cuentas.filter((c) => c.rol === "validador_contenido").length,
      gestores: cuentas.filter((c) => c.rol === "gestor_negocios").length,
    }),
    [cuentas]
  );

  const cuentasFiltradas = cuentas.filter((c) => {
    const coincideBusqueda =
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.correo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === "todos" || c.rol === filtroRol;
    return coincideBusqueda && coincideRol;
  });

  function alcanceDeCuenta(cuenta: Cuenta): string[] {
    if (cuenta.rol === "dueno_negocio") {
      if (cuenta.negocioIds.length === 0) return ["Sin negocios asignados"];
      const nombres = cuenta.negocioIds.map((id) => negocioPorId[id]?.nombre ?? id);
      return nombres.length > 1 ? [nombres[0], `+${nombres.length - 1} más`] : nombres;
    }
    if (cuenta.rol === "super_admin") return ["Acceso total"];
    if (cuenta.rol === "gestor_negocios") return ["Todos los negocios"];
    if (cuenta.distritosAsignados.length === 0) return ["Todos los distritos"];
    return cuenta.distritosAsignados.map((u) => distritos.find((d) => d.ubigeo === u)?.nombre ?? u);
  }

  async function alRestablecerClave(cuenta: Cuenta) {
    setReseteandoClave(true);
    const contrasena = generarContrasenaTemporal();
    const ok = await restablecerClave(cuenta.id, contrasena, token);
    setReseteandoClave(false);
    if (!ok) return;
    setConfirmandoResetearId(null);
    setPasswordPendiente({
      titulo: "Contraseña restablecida",
      nombre: cuenta.nombre,
      correo: cuenta.correo,
      contrasena,
    });
  }

  async function alCrearCuenta(datos: {
    nombre: string;
    correo: string;
    rol: RolCuenta;
    negocioIds: string[];
    distritosAsignados: string[];
  }) {
    const contrasena = generarContrasenaTemporal();
    const ok = await crear(datos, contrasena, token);
    if (!ok) return;
    setModalAbierto(false);
    setPasswordPendiente({
      titulo: "Cuenta creada",
      nombre: datos.nombre,
      correo: datos.correo,
      contrasena,
    });
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Cuentas</h2>
          <p>
            {resumen.total} cuenta{resumen.total === 1 ? "" : "s"} registrada{resumen.total === 1 ? "" : "s"} ·{" "}
            {resumen.activas} activa{resumen.activas === 1 ? "" : "s"}
          </p>
        </div>
        <button className="btn btn-primario" onClick={() => setModalAbierto(true)}>
          ＋ Nueva cuenta
        </button>
      </div>

      {errorCuentas ? (
        <div className="nota-alerta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {errorCuentas}</span>
          <button className="btn-accion-mini" onClick={() => cargar(token)}>
            Reintentar
          </button>
        </div>
      ) : null}

      {cargandoCuentas && cuentas.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Cargando cuentas…
        </div>
      ) : (
      <>
      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>👥</div>
          <div>
            <b>{resumen.total}</b>
            <span>Total cuentas</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>✅</div>
          <div>
            <b>{resumen.activas}</b>
            <span>Activas</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>🏪</div>
          <div>
            <b>{resumen.duenos}</b>
            <span>Dueños de negocio</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>🏛️</div>
          <div>
            <b>{resumen.juntas}</b>
            <span>Junta vecinal</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--coral-suave)" }}>🔍</div>
          <div>
            <b>{resumen.validadores}</b>
            <span>Validadores</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--morado-suave)" }}>🏪</div>
          <div>
            <b>{resumen.gestores}</b>
            <span>Gestores de negocios</span>
          </div>
        </div>
      </div>

      <div className="barra-filtros">
        <div className="buscador-mini">
          🔍
          <input placeholder="Buscar por nombre o correo…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="fila-filtro">
          <button className={`chip-filtro ${filtroRol === "todos" ? "activo" : ""}`} onClick={() => setFiltroRol("todos")}>
            Todos
          </button>
          {(Object.keys(NOMBRE_ROL) as RolCuenta[]).map((rol) => (
            <button
              key={rol}
              className={`chip-filtro ${filtroRol === rol ? "activo" : ""}`}
              onClick={() => setFiltroRol(rol)}
            >
              <span className="punto" style={{ background: COLOR_ROL[rol] }} />
              {NOMBRE_ROL[rol]}
            </button>
          ))}
        </div>
      </div>

      <div className="lista-cuentas">
        {cuentasFiltradas.map((cuenta) => (
          <div
            className={`fila-cuenta ${cuenta.activo ? "" : "inactiva"} ${cuentaSeleccionadaId === cuenta.id ? "seleccionada" : ""}`}
            key={cuenta.id}
            onClick={() => setCuentaSeleccionadaId(cuenta.id)}
          >
            <div className="avatar-rol" style={{ background: COLOR_ROL[cuenta.rol] }}>
              {iniciales(cuenta.nombre)}
            </div>
            <div className="info-cuenta">
              <b>{cuenta.nombre}</b>
              <span className="correo-cuenta">{cuenta.correo}</span>
            </div>
            <span className="rol-pill" style={{ background: COLOR_ROL_SUAVE[cuenta.rol], color: COLOR_ROL_TEXTO[cuenta.rol] }}>
              {NOMBRE_ROL[cuenta.rol]}
            </span>
            <div className="alcance-cuenta">
              {alcanceDeCuenta(cuenta).map((texto, i) => (
                <span className={`chip-alcance ${i > 0 ? "mas" : ""}`} key={i}>
                  {texto}
                </span>
              ))}
            </div>
            <span className={`estado-cuenta-pill ${cuenta.activo ? "activa" : "desactivada"}`}>
              {cuenta.activo ? "Activa" : "Desactivada"}
            </span>
            <div className="fila-acciones-cuenta" onClick={(e) => e.stopPropagation()}>
              <button className="btn-accion-mini resetear" onClick={() => setConfirmandoResetearId(cuenta.id)}>
                🔑 Restablecer
              </button>
              <button
                className={`btn-accion-mini ${cuenta.activo ? "desactivar" : "activar"}`}
                onClick={() => alternarActivo(cuenta.id, token)}
              >
                {cuenta.activo ? "Desactivar" : "Reactivar"}
              </button>
            </div>
          </div>
        ))}
        {cuentasFiltradas.length === 0 ? (
          <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
            No hay cuentas que coincidan con el filtro.
          </div>
        ) : null}
      </div>
      {cursorSiguiente ? (
        <button
          className="btn-accion-mini"
          style={{ display: "block", margin: "16px auto 0" }}
          disabled={cargandoMas}
          onClick={() => cargarMas(token)}
        >
          {cargandoMas ? "Cargando…" : "Cargar más cuentas"}
        </button>
      ) : null}
      </>
      )}

      {modalAbierto ? (
        <ModalNuevaCuenta
          negocios={negocios}
          cuentas={cuentas}
          distritos={distritos}
          onCancelar={() => setModalAbierto(false)}
          onCrear={alCrearCuenta}
        />
      ) : null}

      {cuentaSeleccionada ? (
        <DrawerEditarCuenta
          cuenta={cuentaSeleccionada}
          negocios={negocios}
          negociosAsignadosEnOtraParte={cuentas
            .filter((c) => c.id !== cuentaSeleccionada.id)
            .flatMap((c) => c.negocioIds)}
          distritos={distritos}
          onCerrar={() => setCuentaSeleccionadaId(null)}
          onGuardar={async (datos) => {
            const ok = await actualizar(cuentaSeleccionada.id, datos, token);
            if (ok) setCuentaSeleccionadaId(null);
          }}
          onAgregarNegocio={(negocioId) => agregarNegocio(cuentaSeleccionada.id, negocioId, token)}
          onQuitarNegocio={(negocioId) => quitarNegocio(cuentaSeleccionada.id, negocioId, token)}
          onPedirEliminar={() => setConfirmandoEliminarId(cuentaSeleccionada.id)}
        />
      ) : null}

      {confirmandoEliminar ? (
        <ModalConfirmarEliminar
          cuenta={confirmandoEliminar}
          onCancelar={() => setConfirmandoEliminarId(null)}
          onConfirmar={async () => {
            const ok = await eliminar(confirmandoEliminar.id, token);
            if (ok) {
              setConfirmandoEliminarId(null);
              setCuentaSeleccionadaId(null);
            }
          }}
        />
      ) : null}

      {confirmandoResetear ? (
        <ModalConfirmarResetear
          cuenta={confirmandoResetear}
          cargando={reseteandoClave}
          onCancelar={() => setConfirmandoResetearId(null)}
          onConfirmar={() => alRestablecerClave(confirmandoResetear)}
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

function ModalNuevaCuenta({
  negocios,
  cuentas,
  distritos,
  onCancelar,
  onCrear,
}: {
  negocios: ReturnType<typeof useNegocios.getState>["negocios"];
  cuentas: Cuenta[];
  distritos: ReturnType<typeof useGeografia.getState>["distritos"];
  onCancelar: () => void;
  onCrear: (datos: {
    nombre: string;
    correo: string;
    rol: RolCuenta;
    negocioIds: string[];
    distritosAsignados: string[];
  }) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<RolCuenta>("validador_contenido");
  const [negocioId, setNegocioId] = useState("");
  const [distritosAsignados, setDistritosAsignados] = useState<string[]>([]);

  const negociosAsignados = new Set(cuentas.flatMap((c) => c.negocioIds));
  const negociosDisponibles = negocios.filter((n) => !negociosAsignados.has(n.id));

  function alternarDistrito(ubigeo: string) {
    setDistritosAsignados((actual) =>
      actual.includes(ubigeo) ? actual.filter((u) => u !== ubigeo) : [...actual, ubigeo]
    );
  }

  const valido = nombre.trim() && correo.trim();

  function confirmar() {
    if (!valido) return;
    onCrear({
      nombre: nombre.trim(),
      correo: correo.trim(),
      rol,
      negocioIds: rol === "dueno_negocio" && negocioId ? [negocioId] : [],
      distritosAsignados: rol === "junta_vecinal" || rol === "validador_contenido" ? distritosAsignados : [],
    });
  }

  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Nueva cuenta</h3>
        <p className="sub">Elige el rol primero — los campos de abajo cambian según a qué puede entrar esta persona.</p>

        <div className="campo-modal">
          <label>Nombre completo</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Rocío Salas" autoFocus />
        </div>
        <div className="campo-modal">
          <label>Correo</label>
          <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@ejemplo.com" />
        </div>

        <div className="campo-modal">
          <label>Rol</label>
          <div className="chips-rol">
            {(Object.keys(NOMBRE_ROL) as RolCuenta[]).map((r) => (
              <div
                key={r}
                className={`chip-rol-opcion ${rol === r ? "activo" : ""}`}
                style={
                  rol === r
                    ? { color: "#fff", backgroundColor: COLOR_ROL[r], borderColor: COLOR_ROL[r] }
                    : { color: COLOR_ROL[r] }
                }
                onClick={() => setRol(r)}
              >
                {NOMBRE_ROL[r]}
              </div>
            ))}
          </div>
        </div>

        {rol === "dueno_negocio" ? (
          <div className="campo-modal">
            <label>Negocio (opcional)</label>
            <select value={negocioId} onChange={(e) => setNegocioId(e.target.value)}>
              <option value="">— sin negocio por ahora —</option>
              {negociosDisponibles.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
            <div className="nota-alcance">
              Puedes asignarle este y otros negocios después con "Editar" en esta misma lista — un dueño puede
              administrar varios.
            </div>
          </div>
        ) : null}

        {rol === "junta_vecinal" || rol === "validador_contenido" ? (
          <div className="campo-modal">
            <label>Distritos asignados</label>
            <div className="lista-checks-distrito">
              {distritos.map((d) => (
                <label className="check-distrito" key={d.ubigeo}>
                  <input
                    type="checkbox"
                    checked={distritosAsignados.includes(d.ubigeo)}
                    onChange={() => alternarDistrito(d.ubigeo)}
                  />
                  {d.nombre}
                </label>
              ))}
            </div>
            <div className="nota-alcance">Ninguno marcado = acceso a todos los distritos actuales y futuros.</div>
          </div>
        ) : null}

        <div className="nota-password-info">
          🔑 Se generará una contraseña temporal automáticamente al crear la cuenta — se la compartes tú por un
          canal seguro. No hace falta escribir ninguna clave aquí.
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-crear" disabled={!valido} onClick={confirmar}>
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

function DrawerEditarCuenta({
  cuenta,
  negocios,
  negociosAsignadosEnOtraParte,
  distritos,
  onCerrar,
  onGuardar,
  onAgregarNegocio,
  onQuitarNegocio,
  onPedirEliminar,
}: {
  cuenta: Cuenta;
  negocios: ReturnType<typeof useNegocios.getState>["negocios"];
  negociosAsignadosEnOtraParte: string[];
  distritos: ReturnType<typeof useGeografia.getState>["distritos"];
  onCerrar: () => void;
  onGuardar: (datos: {
    nombre: string;
    correo: string;
    rol: RolCuenta;
    negocioIds: string[];
    distritosAsignados: string[];
  }) => void;
  onAgregarNegocio: (negocioId: string) => void;
  onQuitarNegocio: (negocioId: string) => void;
  onPedirEliminar: () => void;
}) {
  const [nombre, setNombre] = useState(cuenta.nombre);
  const [correo, setCorreo] = useState(cuenta.correo);
  const [rol, setRol] = useState<RolCuenta>(cuenta.rol);
  const [distritosAsignados, setDistritosAsignados] = useState<string[]>(cuenta.distritosAsignados);
  const [negocioAAgregar, setNegocioAAgregar] = useState("");

  const negocioPorId = Object.fromEntries(negocios.map((n) => [n.id, n]));
  const negociosDisponibles = negocios.filter(
    (n) => !cuenta.negocioIds.includes(n.id) && !negociosAsignadosEnOtraParte.includes(n.id)
  );

  function alternarDistrito(ubigeo: string) {
    setDistritosAsignados((actual) =>
      actual.includes(ubigeo) ? actual.filter((u) => u !== ubigeo) : [...actual, ubigeo]
    );
  }

  function confirmarAgregarNegocio() {
    if (!negocioAAgregar) return;
    onAgregarNegocio(negocioAAgregar);
    setNegocioAAgregar("");
  }

  const valido = nombre.trim() && correo.trim();

  function guardar() {
    if (!valido) return;
    onGuardar({
      nombre: nombre.trim(),
      correo: correo.trim(),
      rol,
      negocioIds: cuenta.negocioIds,
      distritosAsignados: rol === "junta_vecinal" || rol === "validador_contenido" ? distritosAsignados : [],
    });
  }

  return (
    <>
      <div className="fondo-drawer" onClick={onCerrar} />
      <div className="drawer">
        <div className="drawer-cierre">
          <button onClick={onCerrar} type="button">✕</button>
        </div>

        <div className="drawer-avatar-grande" style={{ background: COLOR_ROL[cuenta.rol] }}>
          {iniciales(cuenta.nombre)}
        </div>

        <div className="campo-modal">
          <label>Nombre completo</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="campo-modal">
          <label>Correo</label>
          <input value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>

        <div className="campo-modal">
          <label>Rol</label>
          <div className="chips-rol">
            {(Object.keys(NOMBRE_ROL) as RolCuenta[]).map((r) => (
              <div
                key={r}
                className={`chip-rol-opcion ${rol === r ? "activo" : ""}`}
                style={
                  rol === r
                    ? { color: "#fff", backgroundColor: COLOR_ROL[r], borderColor: COLOR_ROL[r] }
                    : { color: COLOR_ROL[r] }
                }
                onClick={() => setRol(r)}
              >
                {NOMBRE_ROL[r]}
              </div>
            ))}
          </div>
        </div>

        {rol === "dueno_negocio" ? (
          <div className="drawer-seccion">
            <div className="etiqueta">Negocios asignados</div>
            {cuenta.negocioIds.length === 0 ? (
              <div className="sin-negocios-asignados">Esta cuenta todavía no administra ningún negocio.</div>
            ) : (
              <div className="lista-negocios-asignados">
                {cuenta.negocioIds.map((id) => (
                  <div className="fila-negocio-asignado" key={id}>
                    <div className="icono-neg">🏪</div>
                    <b>{negocioPorId[id]?.nombre ?? id}</b>
                    <button type="button" title="Quitar" onClick={() => onQuitarNegocio(id)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {negociosDisponibles.length > 0 ? (
              <div className="agregar-negocio-asignado">
                <select value={negocioAAgregar} onChange={(e) => setNegocioAAgregar(e.target.value)}>
                  <option value="">＋ Agregar otro negocio…</option>
                  {negociosDisponibles.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nombre}
                    </option>
                  ))}
                </select>
                <button type="button" disabled={!negocioAAgregar} onClick={confirmarAgregarNegocio}>
                  Agregar
                </button>
              </div>
            ) : null}
            <div className="nota-alcance">
              Una misma persona puede administrar varios negocios — por ejemplo, si tiene más de un local. Solo
              se listan negocios que todavía no tienen dueño.
            </div>
          </div>
        ) : null}

        {rol === "junta_vecinal" || rol === "validador_contenido" ? (
          <div className="drawer-seccion">
            <div className="etiqueta">Distritos asignados</div>
            <div className="lista-checks-distrito">
              {distritos.map((d) => (
                <label className="check-distrito" key={d.ubigeo}>
                  <input
                    type="checkbox"
                    checked={distritosAsignados.includes(d.ubigeo)}
                    onChange={() => alternarDistrito(d.ubigeo)}
                  />
                  {d.nombre}
                </label>
              ))}
            </div>
            <div className="nota-alcance">Ninguno marcado = acceso a todos los distritos actuales y futuros.</div>
          </div>
        ) : null}

        <div className="zona-peligro">
          <div className="etiqueta">Zona de peligro</div>
          <button className="btn-eliminar-cuenta" onClick={onPedirEliminar} type="button">
            🗑️ Eliminar esta cuenta
          </button>
        </div>

        <div className="drawer-acciones-guardar" style={{ marginTop: 16 }}>
          <button className="btn-cancelar" onClick={onCerrar} type="button">
            Cancelar
          </button>
          <button className="btn-guardar" disabled={!valido} onClick={guardar} type="button">
            Guardar cambios
          </button>
        </div>
      </div>
    </>
  );
}

function ModalConfirmarResetear({
  cuenta,
  cargando,
  onCancelar,
  onConfirmar,
}: {
  cuenta: Cuenta;
  cargando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div className="icono-alerta">🔑</div>
        <h3>¿Restablecer la contraseña de "{cuenta.nombre}"?</h3>
        <p className="sub">
          Se genera una contraseña temporal nueva y la anterior deja de funcionar de inmediato — {cuenta.nombre}{" "}
          no va a poder entrar con su contraseña actual hasta que le compartas la nueva.
        </p>

        <div className="fila-cuenta-confirmar">
          <div className="avatar-rol" style={{ background: COLOR_ROL[cuenta.rol], width: 32, height: 32, fontSize: 12 }}>
            {iniciales(cuenta.nombre)}
          </div>
          <div>
            <b>{cuenta.nombre}</b>
            <span>{cuenta.correo}</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </button>
          <button className="btn-eliminar-confirmar" onClick={onConfirmar} disabled={cargando}>
            {cargando ? "Restableciendo…" : "Sí, restablecer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalConfirmarEliminar({
  cuenta,
  onCancelar,
  onConfirmar,
}: {
  cuenta: Cuenta;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div className="icono-alerta">⚠️</div>
        <h3>¿Eliminar esta cuenta?</h3>
        <p className="sub">Esta acción no se puede deshacer. La persona ya no podrá entrar al panel con este correo.</p>

        <div className="fila-cuenta-confirmar">
          <div className="avatar-rol" style={{ background: COLOR_ROL[cuenta.rol], width: 32, height: 32, fontSize: 12 }}>
            {iniciales(cuenta.nombre)}
          </div>
          <div>
            <b>{cuenta.nombre}</b>
            <span>
              {cuenta.correo}
              {cuenta.rol === "dueno_negocio" && cuenta.negocioIds.length > 0
                ? ` — administra ${cuenta.negocioIds.length} negocio${cuenta.negocioIds.length === 1 ? "" : "s"}`
                : ""}
            </span>
          </div>
        </div>

        {cuenta.rol === "dueno_negocio" && cuenta.negocioIds.length > 0 ? (
          <p
            className="sub"
            style={{ color: "var(--coral-fuerte)", background: "var(--coral-suave)", borderRadius: 10, padding: "10px 12px" }}
          >
            ⚠️ Esta cuenta tiene negocios asignados. Al eliminarla, esos negocios quedarán <b>sin dueño</b> (podrás
            asignarles otra cuenta después).
          </p>
        ) : null}

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-eliminar-confirmar" onClick={onConfirmar}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
