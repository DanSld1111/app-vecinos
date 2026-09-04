import { useEffect, useMemo, useRef, useState } from "react";
import { Anuncio, UbicacionAnuncio } from "@app-vecinos/tipos";
import { useAnuncios } from "../estado/useAnuncios";
import { useNegocios } from "../estado/useNegocios";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { entorno } from "../config/entorno";

const NOMBRE_UBICACION: Record<UbicacionAnuncio, string> = {
  carrusel_inicio: "Carrusel Inicio",
  banner_buscar: "Banner Buscar",
};

const ICONO_UBICACION: Record<UbicacionAnuncio, string> = {
  carrusel_inicio: "🏠",
  banner_buscar: "🔍",
};

const DESCRIPCION_UBICACION: Record<UbicacionAnuncio, string> = {
  carrusel_inicio: "Franja rotativa debajo de las categorías, en la pantalla principal",
  banner_buscar: "Banner fijo dentro de la pantalla de Buscar",
};

type EstadoAnuncioVista = "activo" | "programado" | "vencido" | "pausado";

function estadoDe(anuncio: Anuncio): EstadoAnuncioVista {
  if (!anuncio.activo) return "pausado";
  const hoy = new Date().toISOString().slice(0, 10);
  if (anuncio.fechaInicio > hoy) return "programado";
  if (anuncio.fechaFin && anuncio.fechaFin < hoy) return "vencido";
  return "activo";
}

const NOMBRE_ESTADO: Record<EstadoAnuncioVista, string> = {
  activo: "Activo",
  programado: "Programado",
  vencido: "Vencido",
  pausado: "Pausado",
};

function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${dia} ${meses[Number(mes) - 1]}${anio !== new Date().getFullYear().toString() ? ` ${anio}` : ""}`;
}

function formatearVigencia(anuncio: Anuncio): string {
  const inicio = formatearFecha(anuncio.fechaInicio);
  if (!anuncio.fechaFin) return `Desde ${inicio}`;
  return `${inicio} – ${formatearFecha(anuncio.fechaFin)}`;
}

type FiltroUbicacion = "todos" | UbicacionAnuncio;

export function Publicidad() {
  const anuncios = useAnuncios((estado) => estado.anuncios);
  const cargar = useAnuncios((estado) => estado.cargar);
  const crear = useAnuncios((estado) => estado.crear);
  const actualizar = useAnuncios((estado) => estado.actualizar);
  const eliminar = useAnuncios((estado) => estado.eliminar);
  const alternarActivo = useAnuncios((estado) => estado.alternarActivo);
  const negocios = useNegocios((estado) => estado.negocios);
  const token = useSesionAdmin((estado) => estado.token)!;

  useEffect(() => {
    cargar(token);
  }, [cargar, token]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState<FiltroUbicacion>("todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [anuncioEditandoId, setAnuncioEditandoId] = useState<string | null>(null);
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);

  const negocioPorId = useMemo(() => Object.fromEntries(negocios.map((n) => [n.id, n])), [negocios]);
  const anuncioEditando = anuncios.find((a) => a.id === anuncioEditandoId) ?? null;
  const confirmandoEliminar = anuncios.find((a) => a.id === confirmandoEliminarId) ?? null;

  const resumen = useMemo(() => {
    const estados = anuncios.map(estadoDe);
    return {
      total: anuncios.length,
      activos: estados.filter((e) => e === "activo").length,
      programados: estados.filter((e) => e === "programado").length,
      vencidos: estados.filter((e) => e === "vencido").length,
    };
  }, [anuncios]);

  const anunciosFiltrados = anuncios.filter((a) => {
    const coincideBusqueda =
      a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || a.detalle.toLowerCase().includes(busqueda.toLowerCase());
    const coincideUbicacion = filtroUbicacion === "todos" || a.ubicaciones.includes(filtroUbicacion);
    return coincideBusqueda && coincideUbicacion;
  });

  const ejemploCarrusel = anuncios.find((a) => a.ubicaciones.includes("carrusel_inicio") && estadoDe(a) === "activo");
  const ejemploBanner = anuncios.find((a) => a.ubicaciones.includes("banner_buscar") && estadoDe(a) === "activo");

  async function alGuardar(datos: Omit<Anuncio, "id" | "orden" | "activo" | "imagenUrl">) {
    const ok = anuncioEditando ? await actualizar(anuncioEditando.id, datos, token) : await crear(datos, token);
    if (!ok) return;
    setModalAbierto(false);
    setAnuncioEditandoId(null);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Publicidad</h2>
          <p>
            {resumen.total} anuncio{resumen.total === 1 ? "" : "s"} registrado{resumen.total === 1 ? "" : "s"} ·{" "}
            {resumen.activos} activo{resumen.activos === 1 ? "" : "s"} ahora
          </p>
        </div>
        <button
          className="btn btn-primario"
          onClick={() => {
            setAnuncioEditandoId(null);
            setModalAbierto(true);
          }}
        >
          ＋ Nuevo anuncio
        </button>
      </div>

      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>📣</div>
          <div>
            <b>{resumen.total}</b>
            <span>Total anuncios</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>✅</div>
          <div>
            <b>{resumen.activos}</b>
            <span>Activos ahora</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--oro-suave)" }}>⏳</div>
          <div>
            <b>{resumen.programados}</b>
            <span>Programados</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "#eceae2" }}>🗄️</div>
          <div>
            <b>{resumen.vencidos}</b>
            <span>Vencidos</span>
          </div>
        </div>
      </div>

      <div className="layout-publicidad">
        <div>
          <div className="barra-filtros">
            <div className="buscador-mini">
              🔍
              <input placeholder="Buscar anuncio…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div className="fila-filtro">
              <button className={`chip-filtro ${filtroUbicacion === "todos" ? "activo" : ""}`} onClick={() => setFiltroUbicacion("todos")}>
                Todos
              </button>
              {(Object.keys(NOMBRE_UBICACION) as UbicacionAnuncio[]).map((u) => (
                <button
                  key={u}
                  className={`chip-filtro ${filtroUbicacion === u ? "activo" : ""}`}
                  onClick={() => setFiltroUbicacion(u)}
                >
                  {ICONO_UBICACION[u]} {NOMBRE_UBICACION[u]}
                </button>
              ))}
            </div>
          </div>

          <div className="lista-anuncios">
            {anunciosFiltrados.map((anuncio) => {
              const estado = estadoDe(anuncio);
              return (
                <div className="fila-anuncio" key={anuncio.id}>
                  <div className="foto-anuncio">
                    {anuncio.imagenUrl ? <img src={`${entorno.origenApi}${anuncio.imagenUrl}`} alt="" /> : "🖼️"}
                  </div>
                  <div className="info-anuncio">
                    <b>{anuncio.nombre}</b>
                    <span className="detalle-an">{anuncio.detalle}</span>
                  </div>
                  <div className="ubicaciones-an">
                    {anuncio.ubicaciones.map((u) => (
                      <span className={`chip-ubicacion ${u === "carrusel_inicio" ? "inicio" : "buscar"}`} key={u}>
                        {ICONO_UBICACION[u]} {u === "carrusel_inicio" ? "Inicio" : "Buscar"}
                      </span>
                    ))}
                  </div>
                  <span className="negocio-an">
                    {anuncio.negocioId ? negocioPorId[anuncio.negocioId]?.nombre ?? "—" : "Sin negocio (informativo)"}
                  </span>
                  <span className="vigencia-an">{formatearVigencia(anuncio)}</span>
                  <span className={`estado-an-pill ${estado}`}>{NOMBRE_ESTADO[estado]}</span>
                  <div className="fila-acciones-an">
                    <button
                      className="btn-accion-mini"
                      onClick={() => {
                        setAnuncioEditandoId(anuncio.id);
                        setModalAbierto(true);
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button className="btn-accion-mini pausar" onClick={() => alternarActivo(anuncio.id, token)}>
                      {anuncio.activo ? "⏸ Pausar" : "▶ Reactivar"}
                    </button>
                    <button className="btn-accion-mini eliminar" onClick={() => setConfirmandoEliminarId(anuncio.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
            {anunciosFiltrados.length === 0 ? (
              <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
                No hay anuncios que coincidan con el filtro.
              </div>
            ) : null}
          </div>
        </div>

        <div className="panel-referencia">
          <h3>¿Dónde se ve esto?</h3>
          <p className="sub-ref">
            Así aparece hoy en la app — para que sepas exactamente qué estás publicando antes de guardar.
          </p>

          <div className="etiqueta-pantalla">Inicio · Carrusel Inicio</div>
          <div className="telefono">
            <div className="pantalla-tel">
              {ejemploCarrusel ? (
                <>
                  <div className="mini-carrusel">
                    {ejemploCarrusel.imagenUrl ? (
                      <img className="mini-thumb" src={`${entorno.origenApi}${ejemploCarrusel.imagenUrl}`} alt="" />
                    ) : (
                      <div className="mini-thumb" />
                    )}
                    <div className="mini-texto">
                      <b>{ejemploCarrusel.nombre}</b>
                      <span>{ejemploCarrusel.detalle}</span>
                    </div>
                    <span className="mini-cta">Ver →</span>
                  </div>
                  <div className="mini-dots">
                    <span className="activo" />
                    <span />
                    <span />
                  </div>
                </>
              ) : (
                <p className="sin-ejemplo">Ningún anuncio activo en este espacio todavía.</p>
              )}
            </div>
          </div>
          <p className="nota-mini">
            Franja fija de 88px debajo de las categorías. Rota sola cada 6 segundos entre los anuncios activos de
            "Carrusel Inicio", con puntos indicadores.
          </p>

          <div className="etiqueta-pantalla">Buscar · Banner Buscar</div>
          <div className="telefono">
            <div className="pantalla-tel">
              {ejemploBanner ? (
                <div className="mini-banner-buscar">
                  {ejemploBanner.imagenUrl ? (
                    <img className="mini-icono" src={`${entorno.origenApi}${ejemploBanner.imagenUrl}`} alt="" />
                  ) : (
                    <div className="mini-icono">★</div>
                  )}
                  <div>
                    <b>{ejemploBanner.nombre}</b>
                    <span>{ejemploBanner.detalle}</span>
                  </div>
                </div>
              ) : (
                <p className="sin-ejemplo">Ningún anuncio activo en este espacio todavía.</p>
              )}
            </div>
          </div>
          <p className="nota-mini">
            Un solo banner estático, sin carrusel, más abajo en la pantalla de Buscar. Si no vinculas un negocio,
            queda como un aviso puramente informativo — no navega a ningún lado, y eso está bien.
          </p>
        </div>
      </div>

      {modalAbierto ? (
        <ModalAnuncio
          anuncio={anuncioEditando}
          negocios={negocios}
          onCancelar={() => {
            setModalAbierto(false);
            setAnuncioEditandoId(null);
          }}
          onGuardar={alGuardar}
        />
      ) : null}

      {confirmandoEliminar ? (
        <ModalConfirmarEliminarAnuncio
          anuncio={confirmandoEliminar}
          onCancelar={() => setConfirmandoEliminarId(null)}
          onConfirmar={async () => {
            await eliminar(confirmandoEliminar.id, token);
            setConfirmandoEliminarId(null);
          }}
        />
      ) : null}
    </>
  );
}

function ModalAnuncio({
  anuncio,
  negocios,
  onCancelar,
  onGuardar,
}: {
  anuncio: Anuncio | null;
  negocios: ReturnType<typeof useNegocios.getState>["negocios"];
  onCancelar: () => void;
  onGuardar: (datos: Omit<Anuncio, "id" | "orden" | "activo" | "imagenUrl">) => void;
}) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const subirFoto = useAnuncios((estado) => estado.subirFoto);
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  const [nombre, setNombre] = useState(anuncio?.nombre ?? "");
  const [detalle, setDetalle] = useState(anuncio?.detalle ?? "");
  const [ubicaciones, setUbicaciones] = useState<UbicacionAnuncio[]>(anuncio?.ubicaciones ?? []);
  const [negocioId, setNegocioId] = useState(anuncio?.negocioId ?? "");
  const [fechaInicio, setFechaInicio] = useState(anuncio?.fechaInicio ?? new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(anuncio?.fechaFin ?? "");

  function alternarUbicacion(u: UbicacionAnuncio) {
    setUbicaciones((actual) => (actual.includes(u) ? actual.filter((x) => x !== u) : [...actual, u]));
  }

  const valido = nombre.trim() && detalle.trim() && ubicaciones.length > 0 && fechaInicio;

  function confirmar() {
    if (!valido) return;
    onGuardar({
      nombre: nombre.trim(),
      detalle: detalle.trim(),
      ubicaciones,
      negocioId: negocioId || null,
      fechaInicio,
      fechaFin: fechaFin || null,
    });
  }

  async function alElegirArchivo(archivo: File) {
    if (!anuncio) return;
    setSubiendo(true);
    await subirFoto(anuncio.id, archivo, token);
    setSubiendo(false);
  }

  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card ancho" onClick={(e) => e.stopPropagation()}>
        <h3>{anuncio ? "Editar anuncio" : "Nuevo anuncio"}</h3>
        <p className="sub">Los cambios se reflejan de inmediato en la app — no hace falta publicar aparte.</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = "";
            if (archivo) alElegirArchivo(archivo);
          }}
        />
        <div className="campo-modal">
          <label>Imagen</label>
          <div className="selector-imagen">
            <div className="slot-imagen">
              {anuncio?.imagenUrl ? <img src={`${entorno.origenApi}${anuncio.imagenUrl}`} alt="" /> : "🖼️"}
            </div>
            <div>
              <p>
                Se recorta en cuadrado para el carrusel de Inicio. Si no subes una, se muestra un bloque de color
                como ahora.
              </p>
              {anuncio ? (
                <button type="button" disabled={subiendo} onClick={() => inputRef.current?.click()}>
                  {subiendo ? "Subiendo…" : anuncio.imagenUrl ? "Cambiar imagen" : "Subir imagen"}
                </button>
              ) : (
                <button type="button" disabled title="Guarda el anuncio primero para poder subirle una foto">
                  Subir imagen
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="campo-modal">
          <label>Nombre / título</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. 20% en parrillas — El Fogón" autoFocus />
        </div>
        <div className="campo-modal">
          <label>Detalle</label>
          <textarea rows={2} value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Ej. 20% en parrillas todos los martes" />
        </div>

        <div className="campo-modal">
          <label>Aparece en</label>
          <div className="opciones-ubicacion">
            {(Object.keys(NOMBRE_UBICACION) as UbicacionAnuncio[]).map((u) => (
              <label className={`opcion-ubicacion ${ubicaciones.includes(u) ? "marcada" : ""}`} key={u}>
                <input type="checkbox" checked={ubicaciones.includes(u)} onChange={() => alternarUbicacion(u)} />
                <div>
                  <b>
                    {ICONO_UBICACION[u]} {NOMBRE_UBICACION[u]}
                  </b>
                  <span>{DESCRIPCION_UBICACION[u]}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="campo-modal">
          <label>Negocio vinculado (opcional)</label>
          <select value={negocioId} onChange={(e) => setNegocioId(e.target.value)}>
            <option value="">— ninguno, aviso informativo —</option>
            {negocios.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="fila-2-campos">
          <div className="campo-modal">
            <label>Desde</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="campo-modal">
            <label>Hasta (opcional)</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-crear" disabled={!valido} onClick={confirmar}>
            {anuncio ? "Guardar cambios" : "Crear anuncio"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalConfirmarEliminarAnuncio({
  anuncio,
  onCancelar,
  onConfirmar,
}: {
  anuncio: Anuncio;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="overlay-modal" onClick={onCancelar}>
      <div className="modal-card" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div className="icono-alerta">⚠️</div>
        <h3>¿Eliminar este anuncio?</h3>
        <p className="sub">Esta acción no se puede deshacer. El anuncio dejará de mostrarse de inmediato en la app.</p>

        <div className="fila-anuncio" style={{ textAlign: "left", boxShadow: "none", background: "var(--superficie-hundida)" }}>
          <div className="foto-anuncio">🖼️</div>
          <div className="info-anuncio">
            <b>{anuncio.nombre}</b>
            <span className="detalle-an">
              {anuncio.ubicaciones.map((u) => NOMBRE_UBICACION[u]).join(" · ")} · {formatearVigencia(anuncio)}
            </span>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: 18 }}>
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
