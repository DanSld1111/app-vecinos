import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Comunidad } from "@app-vecinos/tipos";
import { useGeografia } from "../estado/useGeografia";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { useNegocios } from "../estado/useNegocios";
import { useAvisos } from "../estado/useAvisos";
import { distritoDeComunidad } from "../utilidades/alcance";

export function Distritos() {
  const distritos = useGeografia((estado) => estado.distritos);
  const comunidades = useGeografia((estado) => estado.comunidades);
  const cargando = useGeografia((estado) => estado.cargando);
  const error = useGeografia((estado) => estado.error);
  const cargar = useGeografia((estado) => estado.cargar);
  const resultadosBusqueda = useGeografia((estado) => estado.resultadosBusqueda);
  const buscando = useGeografia((estado) => estado.buscando);
  const buscarDistritos = useGeografia((estado) => estado.buscarDistritos);
  const limpiarBusqueda = useGeografia((estado) => estado.limpiarBusqueda);
  const activarDistrito = useGeografia((estado) => estado.activarDistrito);
  const desactivarDistrito = useGeografia((estado) => estado.desactivarDistrito);
  const crearComunidad = useGeografia((estado) => estado.crearComunidad);
  const activarComunidad = useGeografia((estado) => estado.activarComunidad);
  const desactivarComunidad = useGeografia((estado) => estado.desactivarComunidad);
  const eliminarComunidad = useGeografia((estado) => estado.eliminarComunidad);
  const token = useSesionAdmin((estado) => estado.token);
  const negocios = useNegocios((estado) => estado.negocios);
  const avisos = useAvisos((estado) => estado.avisos);

  useEffect(() => {
    if (token) cargar(token);
  }, [cargar, token]);

  const [busqueda, setBusqueda] = useState("");
  // Todos los distritos empiezan retraídos — con muchos distritos, la lista no debe verse extensa de entrada.
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [agregandoEn, setAgregandoEn] = useState<string | null>(null);
  const [nombreComunidadInline, setNombreComunidadInline] = useState("");
  const [guardandoComunidad, setGuardandoComunidad] = useState(false);

  const [pestana, setPestana] = useState<"activos" | "inactivos">("activos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [buscaDistrito, setBuscaDistrito] = useState("");
  const [activando, setActivando] = useState<string | null>(null);
  const [confirmandoDesactivarDistrito, setConfirmandoDesactivarDistrito] = useState<string | null>(null);
  const [desactivandoDistrito, setDesactivandoDistrito] = useState(false);
  const [cambiandoComunidadId, setCambiandoComunidadId] = useState<string | null>(null);
  const [confirmandoEliminarComunidad, setConfirmandoEliminarComunidad] = useState<Comunidad | null>(null);
  const [eliminandoComunidad, setEliminandoComunidad] = useState(false);

  function alternarAbierto(ubigeo: string) {
    setAbiertos((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(ubigeo)) nuevo.delete(ubigeo);
      else nuevo.add(ubigeo);
      return nuevo;
    });
  }

  const resumen = useMemo(() => {
    return {
      distritosActivos: distritos.filter((d) => d.activo).length,
      comunidades: comunidades.length,
      negociosTotales: negocios.filter((n) => n.estado === "activo").length,
      porVerificar: negocios.filter((n) => n.estado === "por_verificar").length,
    };
  }, [distritos, comunidades, negocios]);

  const distritosFiltrados = distritos.filter(
    (d) =>
      d.activo === (pestana === "activos") &&
      (d.nombre.toLowerCase().includes(busqueda.toLowerCase()) || d.ubigeo.includes(busqueda)),
  );
  const totalInactivos = distritos.filter((d) => !d.activo).length;

  function statsDeDistrito(ubigeo: string) {
    const suyos = negocios.filter((n) => n.distritoUbigeo === ubigeo);
    const avisosSuyos = avisos.filter((a) => distritoDeComunidad(comunidades, a.comunidadId) === ubigeo);
    return {
      activos: suyos.filter((n) => n.estado === "activo").length,
      pendientes: suyos.filter((n) => n.estado === "por_verificar").length,
      avisosPendientes: avisosSuyos.filter((a) => a.estado === "pendiente").length,
    };
  }

  async function alConfirmarComunidadInline(distritoUbigeo: string) {
    if (!nombreComunidadInline.trim() || !token) return;
    setGuardandoComunidad(true);
    const ok = await crearComunidad({ distritoUbigeo, nombre: nombreComunidadInline.trim() }, token);
    setGuardandoComunidad(false);
    if (ok) {
      setNombreComunidadInline("");
      setAgregandoEn(null);
    }
  }

  async function alActivar(ubigeo: string) {
    if (!token) return;
    setActivando(ubigeo);
    const distrito = await activarDistrito(ubigeo, token);
    setActivando(null);
    if (distrito) {
      setModalAbierto(false);
      setBuscaDistrito("");
      limpiarBusqueda();
      setPestana("activos");
      setAbiertos((actual) => new Set(actual).add(distrito.ubigeo));
      setAgregandoEn(distrito.ubigeo);
    }
  }

  async function alReactivarDistrito(ubigeo: string) {
    if (!token) return;
    setActivando(ubigeo);
    const distrito = await activarDistrito(ubigeo, token);
    setActivando(null);
    if (distrito) setPestana("activos");
  }

  async function alDesactivarDistrito(ubigeo: string) {
    if (!token) return;
    setDesactivandoDistrito(true);
    const ok = await desactivarDistrito(ubigeo, token);
    setDesactivandoDistrito(false);
    if (ok) {
      setConfirmandoDesactivarDistrito(null);
      setPestana("inactivos");
    }
  }

  async function alAlternarComunidad(comunidad: Comunidad) {
    if (!token) return;
    setCambiandoComunidadId(comunidad.id);
    if (comunidad.activo) await desactivarComunidad(comunidad.id, token);
    else await activarComunidad(comunidad.id, token);
    setCambiandoComunidadId(null);
  }

  async function alEliminarComunidad(comunidad: Comunidad) {
    if (!token) return;
    setEliminandoComunidad(true);
    const ok = await eliminarComunidad(comunidad.id, token);
    setEliminandoComunidad(false);
    if (ok) setConfirmandoEliminarComunidad(null);
  }

  if (cargando && distritos.length === 0) {
    return <div className="panel" style={{ padding: 32, textAlign: "center" }}>Cargando distritos…</div>;
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Distritos y comunidades</h2>
          <p>
            {distritos.length} distrito{distritos.length === 1 ? "" : "s"} · {comunidades.length}{" "}
            comunidad{comunidades.length === 1 ? "" : "es"}
          </p>
        </div>
        <button
          className="btn btn-primario"
          onClick={() => {
            setModalAbierto(true);
            setBuscaDistrito("");
            limpiarBusqueda();
          }}
        >
          ＋ Expandir a un distrito nuevo
        </button>
      </div>

      {error ? (
        <div className="panel" style={{ padding: 12, marginBottom: 16, color: "var(--rojo)", background: "var(--rojo-suave)" }}>
          {error}
        </div>
      ) : null}

      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>🗺️</div>
          <div>
            <b>{resumen.distritosActivos}</b>
            <span>Distritos activos</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>📍</div>
          <div>
            <b>{resumen.comunidades}</b>
            <span>Comunidades</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>🏪</div>
          <div>
            <b>{resumen.negociosTotales}</b>
            <span>Negocios totales</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--oro-suave)" }}>⏳</div>
          <div>
            <b>{resumen.porVerificar}</b>
            <span>Por verificar</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          className={`chip-filtro ${pestana === "activos" ? "activo" : ""}`}
          onClick={() => setPestana("activos")}
        >
          Activos ({resumen.distritosActivos})
        </button>
        <button
          type="button"
          className={`chip-filtro ${pestana === "inactivos" ? "activo" : ""}`}
          onClick={() => setPestana("inactivos")}
        >
          Inactivos ({totalInactivos})
        </button>
      </div>

      <div className="buscador-mini" style={{ marginBottom: 16, boxShadow: "var(--sombra)" }}>
        🔍
        <input
          placeholder="Buscar distrito por nombre o ubigeo…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="lista-distritos">
        {distritosFiltrados.map((distrito) => {
          const comunidadesDelDistrito = comunidades.filter((c) => c.distritoUbigeo === distrito.ubigeo);
          const stats = statsDeDistrito(distrito.ubigeo);
          const abierto = abiertos.has(distrito.ubigeo);
          const sinComunidades = comunidadesDelDistrito.length === 0;

          return (
            <div className="tarjeta-distrito" key={distrito.ubigeo}>
              <button className="cabecera-distrito" onClick={() => alternarAbierto(distrito.ubigeo)}>
                <div className={`pin-distrito ${sinComunidades ? "vacio" : ""}`}>📍</div>
                <div className="info-distrito">
                  <div className="nombre-fila">
                    <b>{distrito.nombre}</b>
                    {!distrito.activo ? (
                      <span className="badge badge-vacio">Inactivo</span>
                    ) : sinComunidades ? (
                      <span className="badge badge-vacio">Sin comunidades</span>
                    ) : comunidadesDelDistrito.length === 1 && distrito.ubigeo === distritos[0]?.ubigeo ? (
                      <span className="badge badge-piloto">Piloto</span>
                    ) : (
                      <span className="badge badge-activo">Activo</span>
                    )}
                  </div>
                  <span className="ubigeo">UBIGEO {distrito.ubigeo}</span>
                </div>
                {!sinComunidades ? (
                  <div className="chips-distrito">
                    <span className="chip-mini negocios">{stats.activos} activos</span>
                    {stats.pendientes > 0 ? (
                      <span className="chip-mini pendientes">{stats.pendientes} pendientes</span>
                    ) : null}
                    {stats.avisosPendientes > 0 ? (
                      <span className="chip-mini avisos">{stats.avisosPendientes} avisos</span>
                    ) : null}
                  </div>
                ) : null}
                <div className="lado-derecho-distrito">
                  <span className="contador-comunidades">
                    {comunidadesDelDistrito.length} comunidad{comunidadesDelDistrito.length === 1 ? "" : "es"}
                  </span>
                  <span className={`chevron ${abierto ? "abierto" : ""}`}>▾</span>
                </div>
              </button>

              {abierto ? (
                <div className="cuerpo-distrito">
                  {comunidadesDelDistrito.map((comunidad) => (
                    <div className="fila-comunidad" key={comunidad.id}>
                      <div className="icono-com">📍</div>
                      <div>
                        <b>{comunidad.nombre}</b>
                        <br />
                        <span className="slug">{comunidad.slug}</span>
                      </div>
                      <span className={`badge ${comunidad.activo ? "badge-activo" : "badge-vacio"}`}>
                        {comunidad.activo ? "Activa" : "Inactiva"}
                      </span>
                      <span className="fecha">
                        {comunidad.fechaLanzamiento
                          ? `Lanzada ${new Date(comunidad.fechaLanzamiento).toLocaleDateString("es-PE")}`
                          : "Sin fecha de lanzamiento"}
                      </span>
                      <Link className="ver-negocios" to={`/negocios?comunidadId=${comunidad.id}`}>
                        Ver negocios →
                      </Link>
                      <button
                        type="button"
                        className="btn-accion-mini"
                        disabled={cambiandoComunidadId === comunidad.id}
                        onClick={() => alAlternarComunidad(comunidad)}
                      >
                        {cambiandoComunidadId === comunidad.id
                          ? "…"
                          : comunidad.activo
                            ? "Desactivar"
                            : "Activar"}
                      </button>
                      <button
                        type="button"
                        className="btn-accion-mini desactivar"
                        title="Eliminar comunidad"
                        onClick={() => setConfirmandoEliminarComunidad(comunidad)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}

                  {sinComunidades ? (
                    <div className="estado-vacio-distrito">
                      Este distrito todavía no tiene ninguna comunidad — la app no puede mostrarlo a los
                      vecinos hasta que agregues al menos una.
                    </div>
                  ) : null}

                  {!distrito.activo ? (
                    <div className="estado-vacio-distrito" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ flex: 1 }}>Este distrito está apagado — los vecinos no lo ven en la app.</span>
                      <button
                        type="button"
                        className="btn btn-primario"
                        disabled={activando === distrito.ubigeo}
                        onClick={() => alReactivarDistrito(distrito.ubigeo)}
                      >
                        {activando === distrito.ubigeo ? "Activando…" : "Activar distrito"}
                      </button>
                    </div>
                  ) : null}

                  {distrito.activo && (sinComunidades || comunidadesDelDistrito.every((c) => !c.activo)) ? (
                    confirmandoDesactivarDistrito === distrito.ubigeo ? (
                      <div className="form-inline-comunidad">
                        <span className="sub" style={{ flex: 1 }}>
                          ¿Apagar {distrito.nombre}? Los vecinos dejarán de verlo hasta que se vuelva a activar.
                        </span>
                        <button
                          type="button"
                          className="btn btn-primario"
                          style={{ background: "var(--rojo)" }}
                          disabled={desactivandoDistrito}
                          onClick={() => alDesactivarDistrito(distrito.ubigeo)}
                        >
                          {desactivandoDistrito ? "Apagando…" : "Sí, apagar"}
                        </button>
                        <button className="btn btn-fantasma" onClick={() => setConfirmandoDesactivarDistrito(null)}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="agregar-comunidad"
                        style={{ color: "var(--rojo)" }}
                        onClick={() => setConfirmandoDesactivarDistrito(distrito.ubigeo)}
                      >
                        Apagar distrito {distrito.nombre}
                      </button>
                    )
                  ) : null}

                  {distrito.activo ? (
                    agregandoEn === distrito.ubigeo ? (
                      <div className="form-inline-comunidad">
                        <input
                          autoFocus
                          placeholder="Nombre de la comunidad"
                          value={nombreComunidadInline}
                          onChange={(e) => setNombreComunidadInline(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") alConfirmarComunidadInline(distrito.ubigeo);
                            if (e.key === "Escape") setAgregandoEn(null);
                          }}
                        />
                        <button
                          className="btn btn-primario"
                          disabled={guardandoComunidad}
                          onClick={() => alConfirmarComunidadInline(distrito.ubigeo)}
                        >
                          {guardandoComunidad ? "Guardando…" : "Guardar"}
                        </button>
                        <button className="btn btn-fantasma" onClick={() => setAgregandoEn(null)}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        className="agregar-comunidad"
                        onClick={() => {
                          setAgregandoEn(distrito.ubigeo);
                          setNombreComunidadInline("");
                        }}
                      >
                        ＋ {sinComunidades ? "Agregar primera comunidad" : `Agregar otra comunidad a ${distrito.nombre}`}
                      </button>
                    )
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
        {distritosFiltrados.length === 0 ? (
          <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
            {busqueda
              ? `Ningún distrito coincide con "${busqueda}".`
              : pestana === "activos"
                ? "No hay distritos activos todavía."
                : "No hay distritos apagados — todos los que gestionás están activos."}
          </div>
        ) : null}
      </div>

      {modalAbierto ? (
        <div className="overlay-modal" onClick={() => setModalAbierto(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Expandir a un distrito nuevo</h3>
            <p className="sub">
              Busca el distrito en el catálogo oficial (INEI) y actívalo — no se inventan distritos nuevos,
              solo se enciende uno que ya existe en el mapa del Perú.
            </p>

            <div className="campo-modal">
              <label>Distrito</label>
              <input
                autoFocus
                value={buscaDistrito}
                onChange={(e) => {
                  setBuscaDistrito(e.target.value);
                  if (token) buscarDistritos(e.target.value, token);
                }}
                placeholder="Ej. Barranco, San Isidro…"
              />
            </div>

            <div className="lista-resultados-distrito">
              {buscaDistrito.trim().length < 2 ? (
                <p className="sub" style={{ margin: "8px 0" }}>
                  Escribe al menos 2 letras para buscar.
                </p>
              ) : buscando ? (
                <p className="sub" style={{ margin: "8px 0" }}>Buscando…</p>
              ) : resultadosBusqueda.length === 0 ? (
                <p className="sub" style={{ margin: "8px 0" }}>Ningún distrito coincide.</p>
              ) : (
                resultadosBusqueda.map((d) => (
                  <div className="fila-resultado-distrito" key={d.ubigeo}>
                    <div>
                      <b>{d.nombre}</b>
                      <span className="ubigeo"> · UBIGEO {d.ubigeo}</span>
                    </div>
                    {d.activo ? (
                      <span className="badge badge-activo">Ya activo</span>
                    ) : (
                      <button
                        className="btn btn-primario"
                        disabled={activando === d.ubigeo}
                        onClick={() => alActivar(d.ubigeo)}
                      >
                        {activando === d.ubigeo ? "Activando…" : "Activar"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalAbierto(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmandoEliminarComunidad ? (
        <div className="overlay-modal" onClick={() => setConfirmandoEliminarComunidad(null)}>
          <div className="modal-card" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div className="icono-alerta">⚠️</div>
            <h3>¿Eliminar "{confirmandoEliminarComunidad.nombre}"?</h3>
            <p className="sub">
              Esta acción no se puede deshacer. Si todavía tiene negocios, avisos o vecinos registrados, no se
              va a poder eliminar — desactívala en vez de eso.
            </p>
            <div className="modal-footer" style={{ marginTop: 18 }}>
              <button className="btn-cancelar" onClick={() => setConfirmandoEliminarComunidad(null)}>
                Cancelar
              </button>
              <button
                className="btn-eliminar-confirmar"
                disabled={eliminandoComunidad}
                onClick={() => alEliminarComunidad(confirmandoEliminarComunidad)}
              >
                {eliminandoComunidad ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
