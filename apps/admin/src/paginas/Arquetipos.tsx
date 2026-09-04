import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Arquetipo, CampoArquetipo, PlantillaVisual } from "@app-vecinos/tipos";
import { useArquetipos } from "../estado/useArquetipos";
import { useCategorias } from "../estado/useCategorias";
import { useNegocios } from "../estado/useNegocios";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { PLANTILLAS_VISUALES } from "../datos/plantillasVisuales";
import { NOMBRE_TIPO_CAMPO, VistaPreviaPlantilla } from "./Plantillas";
import { IconoCategoria } from "../componentes/IconoCategoria";
import { SelectorIcono } from "../componentes/SelectorIcono";

export function Arquetipos() {
  const arquetipos = useArquetipos((e) => e.arquetipos);
  const cargandoArquetipos = useArquetipos((e) => e.cargando);
  const errorArquetipos = useArquetipos((e) => e.error);
  const cargar = useArquetipos((e) => e.cargar);
  const crearArquetipo = useArquetipos((e) => e.crear);
  const actualizarArquetipo = useArquetipos((e) => e.actualizar);
  const eliminarArquetipo = useArquetipos((e) => e.eliminar);
  const categorias = useCategorias((e) => e.categorias);
  const negocios = useNegocios((e) => e.negocios);
  const token = useSesionAdmin((e) => e.token);

  useEffect(() => {
    if (token) cargar(token);
  }, [cargar, token]);

  const [creando, setCreando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);

  const plantillaPorId = useMemo(
    () => Object.fromEntries(PLANTILLAS_VISUALES.map((p) => [p.id, p])),
    []
  );

  function usoDe(arquetipoId: string) {
    const cats = categorias.filter((c) => c.arquetipoId === arquetipoId);
    const catIds = new Set(cats.map((c) => c.id));
    const negs = negocios.filter((n) => n.categoriaIds.some((id) => catIds.has(id)));
    return { categorias: cats, negocios: negs };
  }

  const resumen = useMemo(
    () => ({
      total: arquetipos.length,
      sistema: arquetipos.filter((a) => a.origen === "sistema").length,
      personalizados: arquetipos.filter((a) => a.origen === "personalizado").length,
      categoriasConArquetipo: categorias.filter((c) => c.arquetipoId).length,
    }),
    [arquetipos, categorias]
  );

  const editando = editandoId ? arquetipos.find((a) => a.id === editandoId) ?? null : null;
  const confirmandoEliminar = confirmandoEliminarId
    ? arquetipos.find((a) => a.id === confirmandoEliminarId) ?? null
    : null;

  if (creando) {
    return (
      <EditorArquetipo
        modo="crear"
        onCancelar={() => setCreando(false)}
        onGuardar={async (datos) => {
          if (!token) return;
          const ok = await crearArquetipo(datos, token);
          if (ok) setCreando(false);
        }}
      />
    );
  }

  if (editando) {
    const uso = usoDe(editando.id);
    return (
      <EditorArquetipo
        modo="editar"
        arquetipo={editando}
        bloqueado={uso.negocios.length > 0}
        usoInfo={{ categorias: uso.categorias.length, negocios: uso.negocios.length }}
        onCancelar={() => setEditandoId(null)}
        onGuardar={async (datos) => {
          if (!token) return;
          const ok = await actualizarArquetipo(editando.id, datos, token);
          if (ok) setEditandoId(null);
        }}
      />
    );
  }

  if (cargandoArquetipos && arquetipos.length === 0) {
    return <div className="panel" style={{ padding: 32, textAlign: "center" }}>Cargando arquetipos…</div>;
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Arquetipos</h2>
          <p>Cada uno usa una plantilla visual + tus propios nombres de campo</p>
        </div>
        <button className="btn btn-primario" onClick={() => setCreando(true)}>
          ＋ Nuevo arquetipo
        </button>
      </div>

      {errorArquetipos ? (
        <div className="panel" style={{ padding: 12, marginBottom: 16, color: "var(--rojo)", background: "var(--rojo-suave)" }}>
          {errorArquetipos}
        </div>
      ) : null}

      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>🧩</div>
          <div>
            <b>{resumen.total}</b>
            <span>Arquetipos</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--superficie-hundida)" }}>⚙️</div>
          <div>
            <b>{resumen.sistema}</b>
            <span>Del sistema</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--morado-suave)" }}>✨</div>
          <div>
            <b>{resumen.personalizados}</b>
            <span>Personalizados</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>🗂️</div>
          <div>
            <b>{resumen.categoriasConArquetipo}</b>
            <span>Categorías asignadas</span>
          </div>
        </div>
      </div>

      <div className="nota-info">
        ℹ️ Ya no se arman campos desde cero: eliges una plantilla de la galería de{" "}
        <Link to="/plantillas">Plantillas</Link> y solo le pones tus propios nombres. Un arquetipo con negocios
        reales usándolo no permite renombrar sus campos — solo se puede archivar.
      </div>

      <div className="grid-arquetipos">
        {arquetipos.map((a) => {
          const plantilla = plantillaPorId[a.plantillaId];
          const uso = usoDe(a.id);
          return (
            <div className="tarjeta-arquetipo" key={a.id} onClick={() => setEditandoId(a.id)}>
              <div className="cabecera-arquetipo">
                <div
                  className="icono-arquetipo"
                  style={{
                    background: a.origen === "sistema" ? "var(--superficie-hundida)" : "var(--morado-suave)",
                    color: a.origen === "sistema" ? "var(--texto-suave)" : "var(--morado)",
                  }}
                >
                  <IconoCategoria nombre={a.icono} size={20} />
                </div>
                <div>
                  <b>{a.nombre}</b>
                  <span className={`badge-origen ${a.origen === "sistema" ? "sistema" : "personalizado"}`}>
                    {a.origen === "sistema" ? "Del sistema" : "Personalizado"}
                  </span>
                </div>
              </div>

              <div className="chip-plantilla-usada">🎨 {plantilla?.nombre ?? "Plantilla eliminada"}</div>

              <div className="meta-arquetipo">
                🏷️ {uso.categorias.length} categoría{uso.categorias.length === 1 ? "" : "s"} la
                {uso.categorias.length === 1 ? "" : "s"} usa{uso.categorias.length === 1 ? "" : "n"}
                {uso.negocios.length > 0 ? ` · 🔒 ${uso.negocios.length} negocio${uso.negocios.length === 1 ? "" : "s"} con datos` : ""}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn-editar-arquetipo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditandoId(a.id);
                  }}
                >
                  Editar →
                </button>
                {uso.categorias.length === 0 ? (
                  <button
                    className="btn-editar-arquetipo"
                    style={{ background: "var(--rojo-suave)", color: "var(--rojo)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmandoEliminarId(a.id);
                    }}
                  >
                    🗑️
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}

        <div className="tarjeta-nuevo-arquetipo" onClick={() => setCreando(true)}>
          <span className="icono-mas">➕</span>
          <p style={{ margin: 0, fontSize: 11.5, textAlign: "center" }}>
            Diseñar un
            <br />
            arquetipo nuevo
          </p>
        </div>
      </div>

      {confirmandoEliminar ? (
        <div className="overlay-modal" onClick={() => setConfirmandoEliminarId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>¿Eliminar "{confirmandoEliminar.nombre}"?</h3>
            <p className="sub">
              Ninguna categoría lo está usando, así que se puede eliminar sin riesgo. Esta acción no se puede
              deshacer.
            </p>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setConfirmandoEliminarId(null)}>
                Cancelar
              </button>
              <button
                className="btn-crear"
                style={{ background: "var(--rojo)" }}
                onClick={async () => {
                  if (token) await eliminarArquetipo(confirmandoEliminar.id, token);
                  setConfirmandoEliminarId(null);
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function EditorArquetipo({
  modo,
  arquetipo,
  bloqueado = false,
  usoInfo,
  onCancelar,
  onGuardar,
}: {
  modo: "crear" | "editar";
  arquetipo?: Arquetipo;
  bloqueado?: boolean;
  usoInfo?: { categorias: number; negocios: number };
  onCancelar: () => void;
  onGuardar: (datos: { nombre: string; icono: string; plantillaId: string; campos: CampoArquetipo[] }) => void;
}) {
  const [paso, setPaso] = useState<"plantilla" | "personalizar">(modo === "editar" ? "personalizar" : "plantilla");
  const [nombre, setNombre] = useState(arquetipo?.nombre ?? "");
  const [icono, setIcono] = useState(arquetipo?.icono ?? "apps-outline");
  const [plantillaId, setPlantillaId] = useState(arquetipo?.plantillaId ?? "");
  const [campos, setCampos] = useState<CampoArquetipo[]>(arquetipo?.campos ?? []);

  const plantillaElegida = PLANTILLAS_VISUALES.find((p) => p.id === plantillaId) ?? null;

  function elegirPlantilla(p: PlantillaVisual) {
    setPlantillaId(p.id);
    setCampos(
      p.camposEsperados.map((c) => ({ claveOriginal: c.etiqueta, etiqueta: c.etiqueta, obligatorio: c.obligatorio }))
    );
  }

  function actualizarCampo(index: number, cambios: Partial<CampoArquetipo>) {
    setCampos((actual) => actual.map((c, i) => (i === index ? { ...c, ...cambios } : c)));
  }

  const valido = Boolean(nombre.trim()) && Boolean(plantillaId) && campos.every((c) => c.etiqueta.trim());

  function confirmar() {
    if (!valido) return;
    onGuardar({ nombre: nombre.trim(), icono, plantillaId, campos });
  }

  if (paso === "plantilla") {
    return (
      <>
        <div className="topbar">
          <div>
            <h2>Nuevo arquetipo</h2>
            <p>Paso 1 de 2 — elige nombre, ícono y plantilla</p>
          </div>
        </div>

        <div className="pasos-editor">
          <span className="paso actual">① Elegir plantilla</span>
          <span className="flecha-paso">→</span>
          <span className="paso">② Personalizar campos</span>
        </div>

        <div className="tarjeta">
          <div className="fila-2-campos" style={{ marginBottom: 18 }}>
            <div className="campo-modal" style={{ marginBottom: 0 }}>
              <label>Nombre del arquetipo</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Alquiler de equipos" autoFocus />
            </div>
            <div className="campo-modal" style={{ marginBottom: 0 }}>
              <label>Ícono</label>
              <SelectorIcono value={icono} onChange={setIcono} />
            </div>
          </div>

          <h4 style={{ fontSize: 13, marginBottom: 4 }}>¿Qué plantilla visual usa?</h4>
          <p style={{ fontSize: 11, color: "var(--texto-suave)", margin: "0 0 14px" }}>
            Esto define el diseño y los campos disponibles. Puedes ver el catálogo completo en{" "}
            <Link to="/plantillas">Plantillas</Link>.
          </p>

          <div className="mini-grid-plantillas">
            {PLANTILLAS_VISUALES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`mini-tarjeta-plantilla ${plantillaId === p.id ? "activa" : ""}`}
                onClick={() => elegirPlantilla(p)}
              >
                <b>
                  {p.nombre}
                  <span className={`badge-plantilla-mini ${p.origen === "sistema" ? "sistema" : "nueva"}`}>
                    {p.origen === "sistema" ? "Sistema" : "Nueva"}
                  </span>
                </b>
                <div className="mini-preview-p">{p.modo === "lista" ? "📋 Modo lista" : "🗂️ Modo único"}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
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
            Cancelar
          </button>
          <button className="btn btn-primario" disabled={!nombre.trim() || !plantillaId} onClick={() => setPaso("personalizar")}>
            Siguiente: personalizar campos →
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>{modo === "crear" ? `Nuevo arquetipo — ${nombre}` : `Editar arquetipo — ${arquetipo!.nombre}`}</h2>
          <p>
            {modo === "crear"
              ? "Paso 2 de 2 — personaliza los nombres de cada campo"
              : usoInfo
              ? `Usado por ${usoInfo.categorias} categoría${usoInfo.categorias === 1 ? "" : "s"}${
                  usoInfo.negocios > 0
                    ? `, con ${usoInfo.negocios} negocio${usoInfo.negocios === 1 ? "" : "s"} reales`
                    : ""
                }`
              : ""}
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
            Cancelar
          </button>
          <button className="btn btn-primario" disabled={!valido} onClick={confirmar}>
            {modo === "crear" ? "Guardar arquetipo" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {modo === "crear" ? (
        <div className="pasos-editor">
          <span className="paso hecho">✓ Elegir plantilla</span>
          <span className="flecha-paso">→</span>
          <span className="paso actual">② Personalizar campos</span>
        </div>
      ) : null}

      {bloqueado ? (
        <div className="nota-bloqueo">
          🔒 Este arquetipo ya tiene negocios con datos cargados. No se pueden renombrar sus campos hasta que
          esos negocios dejen de usarlo — puedes seguir viéndolos, pero no editarlos.
        </div>
      ) : null}

      <div className="layout-editor">
        <div className="tarjeta">
          <div className="plantilla-elegida-resumen">
            <div>
              <b>🎨 {plantillaElegida?.nombre}</b>
              <span>
                {campos.length} campo{campos.length === 1 ? "" : "s"} fijos — solo puedes renombrarlos y decidir
                cuáles son obligatorios
              </span>
            </div>
            {modo === "crear" ? <button onClick={() => setPaso("plantilla")}>Cambiar plantilla</button> : null}
          </div>

          <div className="lista-campos-personalizar">
            {campos.map((campo, i) => {
              const definicion = plantillaElegida?.camposEsperados[i];
              return (
                <div className="fila-campo-personalizar" key={i}>
                  <input
                    value={campo.etiqueta}
                    disabled={bloqueado}
                    onChange={(e) => actualizarCampo(i, { etiqueta: e.target.value })}
                  />
                  <span className="tipo-campo-pill-fijo">{NOMBRE_TIPO_CAMPO[definicion?.tipo ?? "texto"]}</span>
                  {bloqueado ? (
                    <span className="icono-candado" title="Este campo tiene negocios con datos reales">
                      🔒
                    </span>
                  ) : (
                    <div
                      className={`toggle-obligatorio-mini ${campo.obligatorio ? "on" : ""}`}
                      onClick={() => actualizarCampo(i, { obligatorio: !campo.obligatorio })}
                    >
                      <div className="switch-mini">
                        <i />
                      </div>
                      <span>{campo.obligatorio ? "Obligatorio" : "Opcional"}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 10.5, color: "var(--texto-tenue)", marginTop: 10 }}>
            No puedes agregar ni quitar campos — la plantilla "{plantillaElegida?.nombre}" siempre trae
            exactamente estos {campos.length}. Si necesitas más, elige otra plantilla con más espacios.
          </p>
        </div>

        <div className="panel-referencia">
          <h3>Vista de referencia</h3>
          <p className="sub-ref">Así se ve el diseño de esta plantilla, con datos de ejemplo.</p>
          <div className="etiqueta-pantalla">Panel del dueño</div>
          <div className="telefono">
            <div className="pantalla-tel">
              <VistaPreviaPlantilla id={plantillaId} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
