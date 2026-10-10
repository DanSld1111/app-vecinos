import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuArrowRight, LuPlus } from "react-icons/lu";
import { MAX_DESTACADAS, MetricaParaTi, Publicacion } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { avisarErrorParaTi, useParaTi } from "../estado/useParaTi";
import { alertaExito } from "../estado/useToasts";
import { MiniaturaPublicacion } from "../componentes/paraTi/MiniaturaPublicacion";
import {
  NOMBRE_ESTADO,
  NOMBRE_TIPO,
  avatarDe,
  destacadasEnOrden,
  estadoDe,
  fechaHora,
  haceCuanto,
  miles,
  quedaDestacada,
} from "../utilidades/paraTi";

const NOMBRE_METRICA: Record<MetricaParaTi["clave"], string> = {
  corazones: "Corazones",
  comentarios: "Comentarios",
  compartidos: "Veces compartido",
  visitantes: "Vecinos que abrieron Para ti",
};

function cambio(m: MetricaParaTi): { texto: string; clase: string } {
  if (m.anterior === 0) return m.total > 0 ? { texto: "nuevo", clase: "sube" } : { texto: "", clase: "" };
  const pct = Math.round(((m.total - m.anterior) / m.anterior) * 100);
  return { texto: `${pct > 0 ? "+" : ""}${pct} %`, clase: pct >= 0 ? "sube" : "baja" };
}

/** Inicio de Para ti en el panel (decisión 0092): números, destacadas, por revisar y el muro. */
export function ParaTiInicio() {
  const token = useSesionAdmin((e) => e.token)!;
  const cuenta = useSesionAdmin((e) => e.cuenta)!;
  const navegar = useNavigate();
  const {
    publicaciones,
    cargar,
    cargando,
    resumen,
    cargarResumen,
    comentarios,
    cargarComentarios,
    moderarComentario,
    ordenarDestacadas,
    modulos,
    cargarModulos,
  } = useParaTi();
  const [ordenando, setOrdenando] = useState<Publicacion[] | null>(null);

  useEffect(() => {
    cargar(token);
    cargarResumen(token);
    cargarComentarios("reportados", token);
    cargarModulos();
  }, [token, cargar, cargarResumen, cargarComentarios, cargarModulos]);

  const destacadas = useMemo(() => destacadasEnOrden(publicaciones), [publicaciones]);
  const enPantalla = ordenando ?? destacadas;
  const libres = Math.max(0, MAX_DESTACADAS - destacadas.length);
  const recientes = publicaciones.slice(0, 8);
  const porRevisar = comentarios.filter((c) => (c.reportes ?? 0) > 0 && !c.revisado).slice(0, 3);
  const hoy = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });

  const mover = (i: number, d: -1 | 1) =>
    setOrdenando((lista) => {
      const n = [...(lista ?? destacadas)];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });

  async function guardarOrden() {
    if (!ordenando) return;
    if (await ordenarDestacadas(ordenando.map((p) => p.id), token)) {
      alertaExito("Orden guardado", "Así salen ahora en la app.");
      setOrdenando(null);
    } else avisarErrorParaTi("No se pudo guardar el orden");
  }

  async function revisar(id: string, oculto: boolean) {
    if (await moderarComentario(id, { oculto, revisado: true }, token)) {
      alertaExito(oculto ? "Comentario oculto" : "Comentario visible");
      cargarComentarios("reportados", token);
    } else avisarErrorParaTi("No se pudo cambiar el comentario");
  }

  return (
    <div className="para-ti-admin">
      <div className="cabecera-para-ti">
        <div>
          <span className="fecha-para-ti">{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</span>
          <h2>Hola, {cuenta.nombre.split(" ")[0]}</h2>
        </div>
        <button className="btn-pildora primario" onClick={() => navegar("/para-ti/nueva")}>
          <LuPlus aria-hidden /> Crear publicación
        </button>
      </div>

      {modulos && !modulos.paraTi ? (
        <div className="nota-alerta">
          <span>
            La pestaña Para ti está <b>apagada</b>: los vecinos todavía no la ven. Se enciende en Módulos de la app.
          </span>
        </div>
      ) : null}

      <section className="metricas-para-ti" aria-label="Últimos 7 días">
        {(resumen ?? []).map((m) => {
          const c = cambio(m);
          const tope = Math.max(1, ...m.porDia);
          return (
            <div className="tarjeta-metrica" key={m.clave}>
              <span className="nombre-metrica">{NOMBRE_METRICA[m.clave]}</span>
              <span className="valor-metrica">
                <b>{miles(m.total)}</b>
                {c.texto ? <span className={c.clase}>{c.texto}</span> : null}
              </span>
              <span className="barras-metrica" aria-hidden>
                {m.porDia.map((v, i) => (
                  <i key={i} className={i === m.porDia.length - 1 ? "hoy" : ""} style={{ height: `${Math.max(6, (v / tope) * 100)}%` }} />
                ))}
              </span>
              <small>Últimos 7 días · antes {miles(m.anterior)}</small>
            </div>
          );
        })}
        {!resumen ? <p className="vacio-editor">Cargando números…</p> : null}
      </section>

      <div className="fila-inicio-para-ti">
        <section className="tarjeta-para-ti destacadas-panel" aria-label="Destacadas">
          <div className="titulo-tarjeta-para-ti">
            <div>
              <h3>Destacadas ahora</h3>
              <span>
                {destacadas.length} de {MAX_DESTACADAS} lugares en uso · se quitan solas al vencer
              </span>
            </div>
            {destacadas.length > 1 ? (
              ordenando ? (
                <div className="botones-orden">
                  <button className="btn-pildora" onClick={() => setOrdenando(null)}>
                    Cancelar
                  </button>
                  <button className="btn-pildora primario" onClick={guardarOrden}>
                    Guardar orden
                  </button>
                </div>
              ) : (
                <button className="btn-pildora" onClick={() => setOrdenando(destacadas)}>
                  Ordenar
                </button>
              )
            ) : null}
          </div>
          <div className="fila-destacadas-panel">
            {enPantalla.map((p, i) => {
              const queda = quedaDestacada(p.destacadaHasta!);
              return (
                <div className="destacada-panel" key={p.id}>
                  <Link to={`/para-ti/${p.id}`} className="destacada-panel-caja" aria-label={`Editar: ${p.texto || p.enlaceTitulo || "publicación"}`}>
                    <MiniaturaPublicacion p={p} />
                    <span className="velo-destacada" />
                    <span className={`chip-queda ${queda.urgente ? "urgente" : ""}`}>{p.programada ? "programada" : queda.texto}</span>
                    <span className="titulo-destacada-panel">{p.texto || p.enlaceTitulo || NOMBRE_TIPO[p.tipo]}</span>
                  </Link>
                  {ordenando ? (
                    <div className="mover-destacada">
                      <button type="button" aria-label="Mover antes" disabled={i === 0} onClick={() => mover(i, -1)}>
                        <LuArrowLeft />
                      </button>
                      <button type="button" aria-label="Mover después" disabled={i === enPantalla.length - 1} onClick={() => mover(i, 1)}>
                        <LuArrowRight />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
            {!ordenando
              ? Array.from({ length: libres }, (_, i) => (
                  <Link key={`libre-${i}`} to="/para-ti/nueva" className="destacada-libre" aria-label="Lugar libre: crear una destacada">
                    <LuPlus aria-hidden />
                    Libre
                  </Link>
                ))
              : null}
          </div>
        </section>

        <section className="tarjeta-para-ti por-revisar" aria-label="Por revisar">
          <div className="titulo-tarjeta-para-ti">
            <h3>Por revisar</h3>
            <Link to="/para-ti/comentarios">Ver todos</Link>
          </div>
          {porRevisar.length === 0 ? <p className="vacio-revisar">Nada por revisar. Los comentarios reportados aparecen aquí.</p> : null}
          {porRevisar.map((c) => {
            const av = avatarDe(c.autorNombre);
            return (
              <div className="item-revisar" key={c.id}>
                <span className="avatar-vecino" style={{ background: av.color }}>
                  {av.iniciales}
                </span>
                <div>
                  <span className="meta-revisar">
                    <b>{c.autorNombre}</b> · {c.reportes} {c.reportes === 1 ? "reporte" : "reportes"}
                    {c.oculto ? " · oculto" : ""}
                  </span>
                  <p>{c.texto}</p>
                  <span className="botones-revisar">
                    <button className="btn-pildora chico" onClick={() => revisar(c.id, true)}>
                      {c.oculto ? "Mantener oculto" : "Ocultar"}
                    </button>
                    <button className="btn-pildora chico suave" onClick={() => revisar(c.id, false)}>
                      Está bien
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <section className="muro-panel" aria-label="Tu muro">
        <div className="titulo-tarjeta-para-ti">
          <h3>Tu muro</h3>
          <Link to="/para-ti/publicaciones">Ver todas ({publicaciones.length})</Link>
        </div>
        {cargando && publicaciones.length === 0 ? <p className="vacio-editor">Cargando…</p> : null}
        {!cargando && publicaciones.length === 0 ? (
          <div className="tarjeta vacio-para-ti">
            <b>Todavía no hay publicaciones.</b>
            <Link to="/para-ti/nueva">Crear la primera</Link>
          </div>
        ) : null}
        <div className="cuadricula-para-ti">
          {recientes.map((p) => (
            <TarjetaMuro key={p.id} p={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Una publicación en la cuadrícula del muro del panel. */
export function TarjetaMuro({ p, acciones }: { p: Publicacion; acciones?: React.ReactNode }) {
  const estado = estadoDe(p);
  return (
    <div className="tarjeta-muro">
      <Link to={`/para-ti/${p.id}`} className="caja-muro" aria-label={`Editar: ${p.texto || p.enlaceTitulo || "publicación"}`}>
        <MiniaturaPublicacion p={p} conTexto />
        <span className="velo-muro" />
        <span className="chips-muro">
          <span className={`chip-muro ${estado}`}>{NOMBRE_ESTADO[estado]}</span>
          <span className="chip-muro tipo">{p.tipo === "fotos" && p.fotos.length > 1 ? `${p.fotos.length} fotos` : NOMBRE_TIPO[p.tipo]}</span>
        </span>
        <span className="pie-muro">
          <b>{p.texto || p.enlaceTitulo || NOMBRE_TIPO[p.tipo]}</b>
          <small>
            {estado === "programada"
              ? `Sale el ${fechaHora(p.publicadoEn!)}`
              : estado === "borrador"
                ? `Editado ${haceCuanto(p.actualizadoEn)}`
                : `${miles(p.corazones)} corazones · ${miles(p.comentarios)} comentarios`}
          </small>
        </span>
      </Link>
      {acciones}
    </div>
  );
}
