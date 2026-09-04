import { useEffect, useMemo, useState } from "react";
import { Aviso, CategoriaAviso, Cuenta } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { useAvisos } from "../estado/useAvisos";
import { useGeografia } from "../estado/useGeografia";
import { ESTILO_CATEGORIA } from "./Avisos";

const CATEGORIAS_JUNTA: CategoriaAviso[] = ["junta_vecinal", "municipal", "otro"];

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

type Vista = { tipo: "lista" } | { tipo: "nuevo" } | { tipo: "detalle"; id: string };

export function MisAvisos() {
  const cuenta = useSesionAdmin((estado) => estado.cuenta)!;
  const token = useSesionAdmin((estado) => estado.token)!;
  const avisos = useAvisos((estado) => estado.avisos);
  const cargandoAvisos = useAvisos((estado) => estado.cargando);
  const errorAvisos = useAvisos((estado) => estado.error);
  const cargarPropios = useAvisos((estado) => estado.cargarPropios);
  const enviarAValidacion = useAvisos((estado) => estado.enviarAValidacion);
  const reenviarTrasRechazo = useAvisos((estado) => estado.reenviarTrasRechazo);
  const comunidadesDisponibles = useGeografia((estado) => estado.comunidades);

  useEffect(() => {
    cargarPropios(token);
  }, [cargarPropios, token]);

  const [vista, setVista] = useState<Vista>({ tipo: "lista" });

  // El servidor ya devuelve solo los avisos de esta cuenta (GET /avisos/mios) — solo falta ordenarlos.
  const misAvisos = useMemo(
    () => [...avisos].sort((a, b) => b.publicadoEn.localeCompare(a.publicadoEn)),
    [avisos]
  );

  const comunidad = useMemo(
    () =>
      comunidadesDisponibles.find((c) => cuenta.distritosAsignados.includes(c.distritoUbigeo)) ??
      comunidadesDisponibles[0],
    [cuenta, comunidadesDisponibles]
  );

  const avisoEnDetalle = vista.tipo === "detalle" ? misAvisos.find((a) => a.id === vista.id) ?? null : null;

  if (vista.tipo === "nuevo") {
    return (
      <EditorAviso
        modo="nuevo"
        cuenta={cuenta}
        comunidadId={comunidad?.id ?? ""}
        onCancelar={() => setVista({ tipo: "lista" })}
        onGuardado={async (datos) => {
          // modo="nuevo" — EditorAviso siempre manda el objeto completo en este caso.
          const ok = await enviarAValidacion(datos as Parameters<typeof enviarAValidacion>[0], token);
          if (ok) setVista({ tipo: "lista" });
        }}
      />
    );
  }

  if (avisoEnDetalle && avisoEnDetalle.estado === "rechazado") {
    return (
      <EditorAviso
        modo="corregir"
        cuenta={cuenta}
        comunidadId={comunidad?.id ?? ""}
        aviso={avisoEnDetalle}
        onCancelar={() => setVista({ tipo: "lista" })}
        onGuardado={async (datos) => {
          const ok = await reenviarTrasRechazo(avisoEnDetalle.id, datos, token);
          if (ok) setVista({ tipo: "lista" });
        }}
      />
    );
  }

  if (avisoEnDetalle) {
    return <DetalleAviso aviso={avisoEnDetalle} onVolver={() => setVista({ tipo: "lista" })} />;
  }

  const resumen = {
    total: misAvisos.length,
    publicados: misAvisos.filter((a) => a.estado === "publicado").length,
    pendientes: misAvisos.filter((a) => a.estado === "pendiente").length,
    rechazados: misAvisos.filter((a) => a.estado === "rechazado").length,
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Mis avisos</h2>
          <p>Avisos que redactas para los vecinos — pasan por validación antes de publicarse</p>
        </div>
        <button className="btn btn-primario" onClick={() => setVista({ tipo: "nuevo" })}>
          ＋ Nuevo aviso
        </button>
      </div>

      {errorAvisos ? (
        <div className="nota-alerta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {errorAvisos}</span>
          <button className="btn-accion-mini" onClick={() => cargarPropios(token)}>
            Reintentar
          </button>
        </div>
      ) : null}

      {cargandoAvisos && misAvisos.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Cargando tus avisos…
        </div>
      ) : (
      <>
      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>📣</div>
          <div>
            <b>{resumen.total}</b>
            <span>Avisos en total</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>✅</div>
          <div>
            <b>{resumen.publicados}</b>
            <span>Publicados</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--oro-suave)" }}>⏳</div>
          <div>
            <b>{resumen.pendientes}</b>
            <span>En revisión</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--rojo-suave)" }}>✕</div>
          <div>
            <b>{resumen.rechazados}</b>
            <span>Rechazados — necesitan corrección</span>
          </div>
        </div>
      </div>

      {misAvisos.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Todavía no has redactado ningún aviso.
        </div>
      ) : (
        <div className="lista-avisos-admin">
          {misAvisos.map((aviso) => {
            const estilo = ESTILO_CATEGORIA[aviso.categoria];
            return (
              <div className="fila-aviso-admin" key={aviso.id} style={{ cursor: "pointer" }} onClick={() => setVista({ tipo: "detalle", id: aviso.id })}>
                <div className="icono-cat-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                  {estilo.icono}
                </div>
                <div className="info-aviso-admin">
                  <b>{aviso.titulo}</b>
                  <span className="resumen-cuerpo">{aviso.cuerpo}</span>
                </div>
                <span className={`estado-aviso-pill ${aviso.estado === "publicado" ? "publicado" : aviso.estado === "pendiente" ? "pendiente" : "rechazado"}`}>
                  {aviso.estado === "publicado" ? "✅ Publicado" : aviso.estado === "pendiente" ? "⏳ En revisión" : "✕ Rechazado"}
                </span>
                <button className="btn-gestionar-negocio" style={{ flex: "none" }}>
                  {aviso.estado === "rechazado" ? "Corregir →" : "Ver →"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
    </>
  );
}

function DetalleAviso({ aviso, onVolver }: { aviso: Aviso; onVolver: () => void }) {
  const estilo = ESTILO_CATEGORIA[aviso.categoria];
  const esPublicado = aviso.estado === "publicado";

  return (
    <>
      <div className="topbar">
        <div>
          <h2>{aviso.titulo}</h2>
          <p>{esPublicado ? `Publicado el ${formatearFecha(aviso.publicadoEn)}` : `Enviado el ${formatearFecha(aviso.publicadoEn)}`}</p>
        </div>
        <button
          onClick={onVolver}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontWeight: 700,
            cursor: "pointer",
            background: "var(--superficie-hundida)",
            color: "var(--texto-suave)",
          }}
        >
          ← Volver a mis avisos
        </button>
      </div>

      {esPublicado ? (
        <div className="nota-info">
          ✅ Este aviso ya está publicado y visible para los vecinos. Ya no se puede editar — si necesitas
          corregir algo, crea un aviso nuevo.
        </div>
      ) : (
        <div className="nota-alerta">
          ⏳ Este aviso está en revisión por el equipo ELISUR. Te avisaremos apenas quede aprobado o si hay
          algo que corregir — mientras tanto no puedes editarlo.
        </div>
      )}

      <div className="layout-editor">
        <div className="tarjeta" style={esPublicado ? undefined : { opacity: 0.7 }}>
          {esPublicado ? (
            <div className="resumen-mini" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginBottom: 0 }}>
              <div className="mini-stat">
                <div className="icono" style={{ background: "var(--coral-suave)" }}>🤍</div>
                <div>
                  <b>{aviso.meGusta}</b>
                  <span>Vecinos interesados</span>
                </div>
              </div>
              <div className="mini-stat">
                <div className="icono" style={{ background: "var(--azul-suave)" }}>📤</div>
                <div>
                  <b>{aviso.compartidos}</b>
                  <span>Veces compartido</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="campo-modal">
                <label>Categoría</label>
                <div className="categoria-select-tipo">
                  <div className="opcion-categoria selec" style={{ pointerEvents: "none" }}>
                    <span className="icono-op-cat" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                      {estilo.icono}
                    </span>
                    <div>
                      <b>{estilo.etiqueta}</b>
                      <span>{estilo.descripcion}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="campo-modal">
                <label>Título</label>
                <input value={aviso.titulo} disabled />
              </div>
              <div className="campo-modal" style={{ marginBottom: 0 }}>
                <label>Descripción</label>
                <textarea rows={4} value={aviso.cuerpo} disabled />
              </div>
            </>
          )}
        </div>

        <div className="panel-referencia">
          <h3>{esPublicado ? "Así lo ven los vecinos" : "Vista previa"}</h3>
          <p className="sub-ref">
            {esPublicado ? "Tarjeta real en Notificaciones → Avisos." : "Así se verá una vez aprobado — todavía no es visible."}
          </p>
          <div className="etiqueta-pantalla">Notificaciones</div>
          <div className="telefono">
            <div className="pantalla-tel">
              <div className="mini-tarjeta-aviso">
                <div className="mini-cab-aviso">
                  <div className="mini-avatar-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                    {estilo.icono}
                  </div>
                  <div className="mini-info-fuente">
                    <div className="mini-fila-fuente">
                      <span className="mini-fuente-aviso">{aviso.fuenteNombre}</span>
                      {aviso.fuenteVerificada ? <span className="mini-tick-aviso">✓</span> : null}
                    </div>
                    <span className="mini-fecha-aviso">{formatearFecha(aviso.publicadoEn)}</span>
                  </div>
                  <span className="mini-pill-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                    {estilo.etiqueta}
                  </span>
                </div>
                <div className="mini-cuerpo-aviso-cont">
                  <span className="mini-titulo-aviso">{aviso.titulo}</span>
                  <span className="mini-cuerpo-aviso">{aviso.cuerpo}</span>
                </div>
                <div className="mini-pie-aviso">
                  <span className="mini-accion-aviso">{esPublicado ? "❤️" : "🤍"} {aviso.meGusta}</span>
                  <span className="mini-accion-aviso">📤 {aviso.compartidos}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="nota-mini">
            {esPublicado
              ? "Los contadores reales de \"me interesa\" y compartidos vienen de vecinos usando la app."
              : "En \"me interesa\" y compartidos siempre parte de 0 hasta que se publique de verdad."}
          </p>
        </div>
      </div>
    </>
  );
}

function EditorAviso({
  modo,
  cuenta,
  comunidadId,
  aviso,
  onCancelar,
  onGuardado,
}: {
  modo: "nuevo" | "corregir";
  cuenta: Cuenta;
  comunidadId: string;
  aviso?: Aviso;
  onCancelar: () => void;
  onGuardado: (
    datos:
      | { comunidadId: string; fuenteNombre: string; titulo: string; cuerpo: string; categoria: CategoriaAviso }
      | { titulo: string; cuerpo: string; categoria: CategoriaAviso },
  ) => void;
}) {
  const [categoria, setCategoria] = useState<CategoriaAviso>(aviso?.categoria ?? "junta_vecinal");
  const [titulo, setTitulo] = useState(aviso?.titulo ?? "");
  const [cuerpo, setCuerpo] = useState(aviso?.cuerpo ?? "");

  const estilo = ESTILO_CATEGORIA[categoria];
  const valido = Boolean(titulo.trim() && cuerpo.trim());

  function confirmar() {
    if (!valido) return;
    // "corregir" llama a PATCH /avisos/:id/reenviar, cuyo DTO solo acepta titulo/cuerpo/categoria
    // (comunidadId y fuenteNombre no cambian al corregir un rechazo) — mandarlos igual hace que
    // el servidor rechace la petición ("property comunidadId should not exist").
    if (modo === "corregir") {
      onGuardado({ titulo: titulo.trim(), cuerpo: cuerpo.trim(), categoria });
      return;
    }
    onGuardado({ comunidadId, fuenteNombre: cuenta.nombre, titulo: titulo.trim(), cuerpo: cuerpo.trim(), categoria });
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>{modo === "nuevo" ? "Nuevo aviso" : "Corregir aviso rechazado"}</h2>
          <p>
            {modo === "nuevo"
              ? "Se envía a validación — el equipo ELISUR lo revisa antes de publicarlo"
              : "Ajusta lo que se indica y vuelve a enviarlo — no hace falta escribirnos"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancelar}
            style={{
              border: "none",
              borderRadius: 10,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
              background: "var(--superficie-hundida)",
              color: "var(--texto-suave)",
            }}
          >
            {modo === "nuevo" ? "Cancelar" : "← Volver a mis avisos"}
          </button>
          <button className="btn btn-primario" disabled={!valido} onClick={confirmar}>
            {modo === "nuevo" ? "Enviar a validación" : "Reenviar a validación"}
          </button>
        </div>
      </div>

      {modo === "corregir" && aviso ? (
        <div className="caja-motivo-rechazo">
          ✕ <b>Motivo del rechazo:</b> "{aviso.motivoRechazo}"
        </div>
      ) : (
        <div className="nota-info">
          ℹ️ Como Junta Vecinal, tu nombre de fuente aparece sin la insignia de verificado (esa insignia es
          solo para fuentes oficiales como Sedapal o la Municipalidad). Aun así, tu aviso se ve y funciona
          igual una vez aprobado.
        </div>
      )}

      <div className="layout-editor">
        <div className="tarjeta">
          <div className="campo-modal">
            <label>Categoría</label>
            <div className="categoria-select-tipo">
              {CATEGORIAS_JUNTA.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`opcion-categoria ${categoria === cat ? "selec" : ""}`}
                  onClick={() => setCategoria(cat)}
                >
                  <span className="icono-op-cat" style={{ background: ESTILO_CATEGORIA[cat].fondoVar, color: ESTILO_CATEGORIA[cat].textoVar }}>
                    {ESTILO_CATEGORIA[cat].icono}
                  </span>
                  <div>
                    <b>{ESTILO_CATEGORIA[cat].etiqueta}</b>
                    <span>{ESTILO_CATEGORIA[cat].descripcion}</span>
                  </div>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10.5, color: "var(--texto-tenue)", margin: 0 }}>
              La categoría "Seguridad ciudadana" está reservada para Serenazgo y la Municipalidad — si es algo
              urgente de seguridad, repórtalo directo a Serenazgo.
            </p>
          </div>

          <div className="campo-modal">
            <label>Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Reunión extraordinaria — Sector 4" autoFocus />
          </div>
          <div className="campo-modal" style={{ marginBottom: 0 }}>
            <label>Descripción</label>
            <textarea
              rows={4}
              maxLength={400}
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              placeholder="Ej. Este jueves 3 de septiembre, 7:00 p.m., local comunal."
            />
            <div className="contador-caracteres">{cuerpo.length} / 400 caracteres</div>
          </div>
        </div>

        <div className="panel-referencia">
          <h3>Así lo verán los vecinos</h3>
          <p className="sub-ref">Vista previa exacta de la tarjeta en Notificaciones → Avisos, una vez aprobado.</p>
          <div className="etiqueta-pantalla">Notificaciones</div>
          <div className="telefono">
            <div className="pantalla-tel">
              <div className="mini-tarjeta-aviso">
                <div className="mini-cab-aviso">
                  <div className="mini-avatar-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                    {estilo.icono}
                  </div>
                  <div className="mini-info-fuente">
                    <div className="mini-fila-fuente">
                      <span className="mini-fuente-aviso">{cuenta.nombre}</span>
                    </div>
                    <span className="mini-fecha-aviso">Ahora mismo</span>
                  </div>
                  <span className="mini-pill-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                    {estilo.etiqueta}
                  </span>
                </div>
                <div className="mini-cuerpo-aviso-cont">
                  <span className="mini-titulo-aviso">{titulo || "Título del aviso"}</span>
                  <span className="mini-cuerpo-aviso">{cuerpo || "Cuerpo del aviso…"}</span>
                </div>
                <div className="mini-pie-aviso">
                  <span className="mini-accion-aviso">🤍 0</span>
                  <span className="mini-accion-aviso">📤 0</span>
                </div>
              </div>
            </div>
          </div>
          <p className="nota-mini">
            Nota el ícono sin la marca de verificado (✓) — esa insignia es solo para fuentes oficiales.
          </p>
        </div>
      </div>
    </>
  );
}
