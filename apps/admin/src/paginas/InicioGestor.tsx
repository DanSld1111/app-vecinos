import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EventoHistorialNegocio, Negocio } from "@app-vecinos/tipos";
import { LuArrowRight } from "react-icons/lu";
import { useNegocios } from "../estado/useNegocios";
import { useCuentas } from "../estado/useCuentas";
import { useCategorias } from "../estado/useCategorias";
import { useGeografia } from "../estado/useGeografia";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { apiFetch } from "../datos/clienteApi";
import { partesDeFicha } from "../utilidades/completitudNegocio";
import { urlCompleta } from "../utilidades/media";
import { ModalReenviar } from "../componentes/negocio/ModalReenviar";
import { describirEvento, fechaCorta } from "../componentes/negocio/HistorialNegocio";

type Filtro = "todos" | "rechazado" | "revision" | "incompleto";

const PUNTO: Record<string, string> = { aprobar: "verde", rechazar: "rojo", reenviar: "azul", crear: "azul" };

/**
 * Inicio del gestor de negocios (decisión 0086): su resumen y lo que necesita su atención —
 * negocios rechazados (con el motivo y el botón para reenviarlos), fichas incompletas, lo que
 * espera al validador y su actividad reciente. Todo acotado a sus distritos (lo hace la API).
 */
export function InicioGestor() {
  const navegar = useNavigate();
  const token = useSesionAdmin((e) => e.token)!;
  const cuenta = useSesionAdmin((e) => e.cuenta)!;
  const negocios = useNegocios((e) => e.negocios);
  const cargarNegocios = useNegocios((e) => e.cargarAdmin);
  const cargando = useNegocios((e) => e.cargando);
  const cuentas = useCuentas((e) => e.cuentas);
  const cargarCuentas = useCuentas((e) => e.cargar);
  const categorias = useCategorias((e) => e.categorias);
  const cargarCategorias = useCategorias((e) => e.cargar);
  const distritos = useGeografia((e) => e.distritos);
  const cargarDistritos = useGeografia((e) => e.cargar);
  const [actividad, setActividad] = useState<EventoHistorialNegocio[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [reenviando, setReenviando] = useState<Negocio | null>(null);

  useEffect(() => {
    cargarNegocios(token);
    cargarCuentas(token);
    if (categorias.length === 0) cargarCategorias();
    if (distritos.length === 0) cargarDistritos(token);
    apiFetch<EventoHistorialNegocio[]>("/negocios/actividad", { token })
      .then(setActividad)
      .catch(() => setActividad([]));
    // Solo al entrar: el resto se actualiza solo en el store al editar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const conDueno = useMemo(() => new Set(cuentas.filter((c) => c.rol === "dueno_negocio").flatMap((c) => c.negocioIds)), [cuentas]);
  const grupos = useMemo(() => {
    const vigentes = negocios.filter((n) => !n.archivadoEn);
    const rechazados = vigentes.filter((n) => n.estado === "inactivo" && n.motivoRechazo);
    const revision = vigentes.filter((n) => n.estado === "por_verificar");
    const incompletos = vigentes
      .filter((n) => !rechazados.includes(n))
      .map((n) => ({ n, faltan: partesDeFicha(n, conDueno.has(n.id), categorias).filter((p) => !p.completa) }))
      .filter((x) => x.faltan.length > 0);
    return { vigentes, rechazados, revision, incompletos, mios: vigentes.filter((n) => n.creadoPorCuentaId === cuenta.id).length };
  }, [negocios, conDueno, categorias, cuenta.id]);

  const nombresDistritos = cuenta.distritosAsignados.length
    ? cuenta.distritosAsignados.map((u) => distritos.find((d) => d.ubigeo === u)?.nombre ?? u).join(", ")
    : "todos los distritos";
  const atencion = grupos.rechazados.length + grupos.incompletos.length;
  const nombre = cuenta.nombre.split(" ")[0];

  const lista: { n: Negocio; tipo: "rechazado" | "incompleto"; faltan?: ReturnType<typeof partesDeFicha> }[] = [
    ...(filtro === "todos" || filtro === "rechazado" ? grupos.rechazados.map((n) => ({ n, tipo: "rechazado" as const })) : []),
    ...(filtro === "todos" || filtro === "incompleto" ? grupos.incompletos.map((x) => ({ n: x.n, tipo: "incompleto" as const, faltan: x.faltan })) : []),
  ];

  const cifras: { id: Filtro; valor: number; texto: string; pie: string; tono: string }[] = [
    { id: "todos", valor: grupos.vigentes.length, texto: "Negocios en tus distritos", pie: grupos.mios ? `${grupos.mios} ${grupos.mios === 1 ? "registrado" : "registrados"} por ti` : grupos.vigentes.length ? "Ninguno registrado por ti aún" : "Registra el primero", tono: "verde" },
    { id: "rechazado", valor: grupos.rechazados.length, texto: "Rechazados", pie: "Corrige y reenvía", tono: "rojo" },
    { id: "revision", valor: grupos.revision.length, texto: "En revisión", pie: "Los revisa el validador", tono: "azul" },
    { id: "incompleto", valor: grupos.incompletos.length, texto: "Con la ficha incompleta", pie: "Les falta algo", tono: "oro" },
  ];
  const total = Math.max(grupos.vigentes.length, 1);

  return (
    <div className="inicio-gestor">
      <div className="topbar">
        <div>
          <h2>Hola, {nombre}</h2>
          <p>
            {atencion ? (
              <>
                Tienes <b>{atencion} {atencion === 1 ? "negocio" : "negocios"}</b> que necesitan tu atención.
              </>
            ) : (
              "No tienes nada pendiente."
            )}{" "}
            Trabajas en <b>{nombresDistritos}</b>.
          </p>
        </div>
        <button className="btn btn-primario" onClick={() => navegar("/negocios/nuevo")}>
          ＋ Registrar negocio
        </button>
      </div>

      <div className="cifras-gestor" role="group" aria-label="Resumen">
        {cifras.map((c) => (
          <button key={c.id} type="button" className={`cifra-gestor ${c.tono}`} aria-pressed={filtro === c.id} onClick={() => setFiltro(c.id)}>
            <b>{cargando && negocios.length === 0 ? "…" : c.valor}</b>
            <span>{c.texto}</span>
            <i>{c.pie}</i>
            <div className="barra-cifra">
              <i style={{ width: `${c.id === "todos" ? 100 : (c.valor / total) * 100}%` }} />
            </div>
          </button>
        ))}
      </div>

      <div className="columnas-gestor">
        <section className="bloque-gestor" aria-labelledby="t-atencion">
          <h3 id="t-atencion">
            {filtro === "revision" ? "En revisión" : "Necesitan tu atención"} <small>{filtro === "revision" ? grupos.revision.length : lista.length}</small>
          </h3>
          {filtro === "revision" ? (
            grupos.revision.length ? (
              grupos.revision.map((n) => <FilaNegocio key={n.id} n={n} detalle="Esperando al validador" />)
            ) : (
              <p className="vacio-gestor">Nada esperando revisión.</p>
            )
          ) : lista.length ? (
            lista.map(({ n, tipo, faltan }) => (
              <div className="pendiente-gestor" key={n.id}>
                <Miniatura n={n} />
                <div className="pendiente-texto">
                  <span className={`etiqueta-pendiente ${tipo === "rechazado" ? "rojo" : "oro"}`}>
                    {tipo === "rechazado" ? "Rechazado" : "Ficha incompleta"}
                  </span>
                  <Link to={`/negocios/${n.id}`} className="nombre-pendiente">
                    {n.nombre}
                  </Link>
                  <p>{tipo === "rechazado" ? "No está publicado" : `${n.estado === "activo" ? "Publicado" : "Sin publicar"} · le falta${faltan!.length === 1 ? "" : "n"} ${faltan!.length}`}</p>
                  {tipo === "rechazado" ? (
                    <div className="motivo-reenvio">
                      <b>Motivo:</b> {n.motivoRechazo}
                    </div>
                  ) : (
                    <div className="faltas-tarjeta">
                      {faltan!.map((p) => (
                        <button key={p.clave} type="button" className="chip-falta" onClick={() => navegar(`/negocios/${n.id}${p.pestana ? `?tab=${p.pestana}` : ""}`)}>
                          Falta: {p.etiqueta.charAt(0).toUpperCase() + p.etiqueta.slice(1)} <LuArrowRight />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="acciones-pendiente">
                  {tipo === "rechazado" ? (
                    <>
                      <button className="btn btn-primario" onClick={() => setReenviando(n)}>
                        Reenviar
                      </button>
                      <button className="btn-accion-mini" onClick={() => navegar(`/negocios/${n.id}`)}>
                        Corregir
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-accion-mini"
                      onClick={() => navegar(`/negocios/${n.id}${faltan![0].pestana ? `?tab=${faltan![0].pestana}` : ""}`)}
                    >
                      Completar
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="vacio-gestor">{cargando ? "Cargando…" : "Nada pendiente aquí. ¡Buen trabajo!"}</p>
          )}
        </section>

        <div className="lateral-gestor">
          <section className="bloque-gestor" aria-labelledby="t-revision">
            <h3 id="t-revision">
              Esperando revisión <small>el validador los publica</small>
            </h3>
            {grupos.revision.length ? (
              grupos.revision.slice(0, 5).map((n) => <FilaNegocio key={n.id} n={n} detalle={n.notaReenvio ? "Reenviado con tu nota" : "Enviado a revisión"} />)
            ) : (
              <p className="vacio-gestor">Nada esperando revisión.</p>
            )}
          </section>
          <section className="bloque-gestor" aria-labelledby="t-actividad">
            <h3 id="t-actividad">Actividad reciente</h3>
            {actividad === null ? (
              <p className="vacio-gestor">Cargando…</p>
            ) : actividad.length ? (
              actividad.map((e, i) => (
                <div className="fila-actividad" key={i}>
                  <span className={`punto-actividad ${PUNTO[e.accion] ?? "oro"}`} />
                  <div className="texto-actividad">
                    <span>
                      <b>{e.cuentaNombre === cuenta.nombre ? "Tú" : e.cuentaNombre ?? "Sistema"}</b> {describirEvento(e)}
                    </span>
                    {e.negocioId ? <Link to={`/negocios/${e.negocioId}`}>{e.negocioNombre}</Link> : null}
                  </div>
                  <time dateTime={e.creadoEn}>{fechaCorta(e.creadoEn)}</time>
                </div>
              ))
            ) : (
              <p className="vacio-gestor">Todavía no hay actividad.</p>
            )}
          </section>
        </div>
      </div>

      {reenviando ? <ModalReenviar negocio={reenviando} onCerrar={() => setReenviando(null)} /> : null}
    </div>
  );
}

function Miniatura({ n }: { n: Negocio }) {
  const foto = urlCompleta(n.fotoPrincipalUrl);
  return (
    <div className="miniatura-gestor" style={foto ? { backgroundImage: `url(${foto})` } : undefined}>
      {foto
        ? null
        : n.nombre
            .split(" ")
            .filter((p) => p.length > 2)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")}
    </div>
  );
}

function FilaNegocio({ n, detalle }: { n: Negocio; detalle: string }) {
  return (
    <div className="fila-actividad">
      <span className="punto-actividad azul" />
      <div className="texto-actividad">
        <Link to={`/negocios/${n.id}`}>{n.nombre}</Link>
        <span>{detalle}</span>
      </div>
    </div>
  );
}
