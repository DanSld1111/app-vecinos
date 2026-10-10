import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LuPlus } from "react-icons/lu";
import { Publicacion } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { useParaTi } from "../estado/useParaTi";
import { MiniaturaPublicacion } from "../componentes/paraTi/MiniaturaPublicacion";
import { NOMBRE_TIPO } from "../utilidades/paraTi";

type Evento = { tipo: "sale" | "publicada" | "termina"; p: Publicacion; hora: Date };

const DIAS_ATRAS = 7;
const DIAS_ADELANTE = 21;

const claveDia = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const hora = (d: Date) => d.toLocaleTimeString("es-PE", { hour: "numeric", minute: "2-digit" });

const NOMBRE_EVENTO: Record<Evento["tipo"], string> = { sale: "Sale", publicada: "Publicada", termina: "Deja de estar destacada" };

/** Calendario de Para ti (decisión 0092): lo que salió, lo programado y cuándo vence cada destacada. */
export function ParaTiCalendario() {
  const token = useSesionAdmin((e) => e.token)!;
  const { publicaciones, cargar } = useParaTi();
  const [elegido, setElegido] = useState<string | null>(null);

  useEffect(() => {
    cargar(token);
  }, [token, cargar]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = useMemo(
    () => Array.from({ length: DIAS_ATRAS + DIAS_ADELANTE }, (_, i) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - DIAS_ATRAS + i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hoy.getTime()],
  );

  const porDia = useMemo(() => {
    const mapa = new Map<string, Evento[]>();
    const agregar = (e: Evento) => {
      const k = claveDia(e.hora);
      mapa.set(k, [...(mapa.get(k) ?? []), e]);
    };
    for (const p of publicaciones) {
      if (p.estado !== "publicada" || !p.publicadoEn) continue;
      agregar({ tipo: p.programada ? "sale" : "publicada", p, hora: new Date(p.publicadoEn) });
      if (p.destacadaHasta) agregar({ tipo: "termina", p, hora: new Date(p.destacadaHasta) });
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.hora.getTime() - b.hora.getTime());
    return mapa;
  }, [publicaciones]);

  const conEventos = dias.filter((d) => porDia.has(claveDia(d)) && d >= hoy);
  const visibles = elegido ? dias.filter((d) => claveDia(d) === elegido) : conEventos;

  return (
    <div className="para-ti-admin">
      <div className="cabecera-para-ti">
        <div>
          <h2>Calendario</h2>
          <span className="fecha-para-ti">Lo programado, lo que salió esta semana y cuándo vence cada destacada.</span>
        </div>
        <Link className="btn-pildora primario" to="/para-ti/nueva">
          <LuPlus aria-hidden /> Programar una publicación
        </Link>
      </div>

      <div className="tira-calendario" role="list" aria-label="Días">
        {dias.map((d) => {
          const k = claveDia(d);
          const eventos = porDia.get(k) ?? [];
          const esHoy = d.getTime() === hoy.getTime();
          return (
            <button
              key={k}
              type="button"
              role="listitem"
              className={`dia-calendario ${esHoy ? "hoy" : ""} ${elegido === k ? "elegido" : ""} ${d < hoy ? "pasado" : ""}`}
              aria-pressed={elegido === k}
              aria-label={`${d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}: ${eventos.length} ${eventos.length === 1 ? "evento" : "eventos"}`}
              onClick={() => setElegido(elegido === k ? null : k)}
            >
              <small>{d.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", "")}</small>
              <b>{d.getDate()}</b>
              <span className="puntos-dia" aria-hidden>
                {eventos.slice(0, 4).map((e, i) => (
                  <i key={i} className={e.tipo} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="leyenda-calendario" aria-hidden>
        <span><i className="sale" /> Programada</span>
        <span><i className="publicada" /> Publicada</span>
        <span><i className="termina" /> Vence destacada</span>
      </div>

      {visibles.length === 0 ? (
        <div className="tarjeta vacio-para-ti">
          <b>{elegido ? "Nada ese día." : "No hay nada programado desde hoy."}</b>
          <Link to="/para-ti/nueva">Programar una publicación</Link>
        </div>
      ) : null}

      <div className="agenda-para-ti">
        {visibles.map((d) => {
          const eventos = porDia.get(claveDia(d)) ?? [];
          return (
            <section key={claveDia(d)} className="dia-agenda">
              <h3>{d.getTime() === hoy.getTime() ? "Hoy" : d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}</h3>
              {eventos.length === 0 ? <p className="vacio-revisar">Sin publicaciones.</p> : null}
              {eventos.map((e) => (
                <Link key={`${e.tipo}-${e.p.id}`} to={`/para-ti/${e.p.id}`} className="evento-agenda">
                  <span className="hora-evento">{hora(e.hora)}</span>
                  <span className="mini-evento">
                    <MiniaturaPublicacion p={e.p} />
                  </span>
                  <span className="texto-evento">
                    <span className={`chip-evento ${e.tipo}`}>{NOMBRE_EVENTO[e.tipo]}</span>
                    <b>{e.p.texto || e.p.enlaceTitulo || NOMBRE_TIPO[e.p.tipo]}</b>
                  </span>
                </Link>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
