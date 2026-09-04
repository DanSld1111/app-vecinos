import { useEffect, useMemo, useRef, useState } from "react";
import { Categoria } from "@app-vecinos/tipos";
import { useCategorias } from "../estado/useCategorias";
import { useNegocios } from "../estado/useNegocios";
import { useArquetipos } from "../estado/useArquetipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { IconoCategoria } from "../componentes/IconoCategoria";
import { SelectorIcono } from "../componentes/SelectorIcono";
import { urlCompleta } from "../utilidades/media";

const CLASE_BADGE_POR_ARQUETIPO: Record<string, string> = {
  "arq-menu": "menu",
  "arq-catalogo": "catalogo",
  "arq-servicios": "servicios",
  "arq-rubros": "rubros",
  "arq-ofertas": "ofertas",
};

export function Categorias() {
  const categorias = useCategorias((estado) => estado.categorias);
  const cargar = useCategorias((estado) => estado.cargar);
  const negocios = useNegocios((estado) => estado.negocios);
  const arquetipos = useArquetipos((estado) => estado.arquetipos);
  const token = useSesionAdmin((estado) => estado.token)!;

  useEffect(() => {
    cargar();
  }, [cargar]);

  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);

  const arquetipoPorId = useMemo(() => Object.fromEntries(arquetipos.map((a) => [a.id, a])), [arquetipos]);

  const resumen = useMemo(() => {
    const conArquetipo = categorias.filter((c) => c.arquetipoId).length;
    const negociosCategorizados = new Set(negocios.flatMap((n) => n.categoriaIds)).size;
    return {
      total: categorias.length,
      conArquetipo,
      sinDefinir: categorias.length - conArquetipo,
      negociosCategorizados,
    };
  }, [categorias, negocios]);

  const categoriasFiltradas = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Categorías</h2>
          <p>
            {resumen.total} categoría{resumen.total === 1 ? "" : "s"} activa{resumen.total === 1 ? "" : "s"}
          </p>
        </div>
        <button
          className="btn btn-primario"
          onClick={() => {
            setEditando(null);
            setModalAbierto(true);
          }}
        >
          ＋ Nueva categoría
        </button>
      </div>

      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>🗂️</div>
          <div>
            <b>{resumen.total}</b>
            <span>Categorías</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>✅</div>
          <div>
            <b>{resumen.conArquetipo}</b>
            <span>Con arquetipo</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--rojo-suave)" }}>⚠️</div>
          <div>
            <b>{resumen.sinDefinir}</b>
            <span>Sin definir</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--oro-suave)" }}>🏪</div>
          <div>
            <b>{resumen.negociosCategorizados}</b>
            <span>Negocios categorizados</span>
          </div>
        </div>
      </div>

      <div className="buscador-mini" style={{ marginBottom: 18, boxShadow: "var(--sombra)" }}>
        🔍
        <input
          placeholder="Buscar categoría por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="grid-categorias">
        {categoriasFiltradas.map((cat) => {
          const arq = cat.arquetipoId ? arquetipoPorId[cat.arquetipoId] : null;
          const sinDefinir = !arq;
          const clase = arq ? CLASE_BADGE_POR_ARQUETIPO[arq.id] ?? "personalizado" : "sindefinir";
          return (
            <div
              className={`tarjeta-cat ${sinDefinir ? "atencion" : ""}`}
              key={cat.id}
              onClick={() => {
                setEditando(cat);
                setModalAbierto(true);
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="fila-top-cat">
                <div
                  className="icono-cat-grande"
                  style={{
                    background: cat.fotoUrl ? "transparent" : sinDefinir ? "var(--rojo-suave)" : "var(--superficie-hundida)",
                    color: sinDefinir ? "var(--rojo)" : "var(--texto-suave)",
                    overflow: "hidden",
                  }}
                >
                  {cat.fotoUrl ? (
                    <img
                      src={urlCompleta(cat.fotoUrl)}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <IconoCategoria nombre={cat.icono} size={22} />
                  )}
                </div>
                <span className="orden-badge">{String(cat.orden).padStart(2, "0")}</span>
              </div>
              <div>
                <p className="nombre-cat">{cat.nombre}</p>
                <span className="slug-cat">{cat.slug}</span>
              </div>
              <span className={`badge-arq ${clase}`}>{sinDefinir ? "⚠️ Sin definir" : arq!.nombre}</span>
            </div>
          );
        })}
        {categoriasFiltradas.length === 0 ? (
          <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)", gridColumn: "1 / -1" }}>
            Ninguna categoría coincide con "{busqueda}".
          </div>
        ) : null}
      </div>

      {modalAbierto ? (
        <ModalCategoria
          categoria={editando}
          arquetipos={arquetipos}
          token={token}
          onCerrar={() => {
            setModalAbierto(false);
            setEditando(null);
          }}
        />
      ) : null}
    </>
  );
}

function ModalCategoria({
  categoria,
  arquetipos,
  token,
  onCerrar,
}: {
  categoria: Categoria | null;
  arquetipos: ReturnType<typeof useArquetipos.getState>["arquetipos"];
  token: string;
  onCerrar: () => void;
}) {
  const crear = useCategorias((estado) => estado.crear);
  const actualizar = useCategorias((estado) => estado.actualizar);
  const subirFoto = useCategorias((estado) => estado.subirFoto);
  const inputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [icono, setIcono] = useState(categoria?.icono ?? "pricetag-outline");
  const [arquetipoId, setArquetipoId] = useState(categoria?.arquetipoId ?? "");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  function slugificar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function guardar() {
    if (!nombre.trim()) return;
    setGuardando(true);
    const ok = categoria
      ? await actualizar(categoria.id, { nombre: nombre.trim(), icono, arquetipoId: arquetipoId || null }, token)
      : await crear({ nombre: nombre.trim(), icono, arquetipoId: arquetipoId || undefined }, token);
    setGuardando(false);
    if (ok) onCerrar();
  }

  async function alElegirArchivo(archivo: File) {
    if (!categoria) return;
    setSubiendo(true);
    await subirFoto(categoria.id, archivo, token);
    setSubiendo(false);
  }

  return (
    <div className="overlay-modal" onClick={onCerrar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{categoria ? `Editar "${categoria.nombre}"` : "Nueva categoría"}</h3>
        <p className="sub">
          {categoria ? "Aparece así en el explorador de Inicio." : "Aparecerá en el explorador de categorías de la app."}
        </p>

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
          <label>Foto de la tarjeta en Inicio</label>
          <div className="selector-imagen">
            <div className="slot-imagen">
              {categoria?.fotoUrl ? (
                <img src={urlCompleta(categoria.fotoUrl)} alt="" />
              ) : (
                <IconoCategoria nombre={icono} size={22} />
              )}
            </div>
            <div>
              <p>
                {categoria
                  ? "Reemplaza al ícono en la tarjeta grande de Inicio."
                  : "Podrás subirla apenas guardes la categoría."}
              </p>
              {categoria ? (
                <button type="button" disabled={subiendo} onClick={() => inputRef.current?.click()}>
                  {subiendo ? "Subiendo…" : categoria.fotoUrl ? "Cambiar foto" : "Subir foto"}
                </button>
              ) : (
                <button type="button" disabled title="Guarda la categoría primero para poder subirle una foto">
                  Subir foto
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="fila-2-campos">
          <div className="campo-modal">
            <label>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Belleza" autoFocus />
          </div>
          <div className="campo-modal">
            <label>Ícono de respaldo</label>
            <SelectorIcono value={icono} onChange={setIcono} />
          </div>
        </div>
        {!categoria && nombre.trim() ? (
          <p className="ayuda-modal" style={{ marginTop: -8 }}>Slug: {slugificar(nombre)}</p>
        ) : null}

        <div className="campo-modal" style={{ marginTop: 4 }}>
          <label>Arquetipo de ficha</label>
          <div className="selector-arquetipo">
            <button
              type="button"
              className={`opcion-arq ${arquetipoId === "" ? "selec" : ""}`}
              onClick={() => setArquetipoId("")}
            >
              <span className="emoji-arq">➖</span>
              Sin definir
            </button>
            {arquetipos.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`opcion-arq ${arquetipoId === a.id ? "selec" : ""}`}
                onClick={() => setArquetipoId(a.id)}
              >
                <span className="emoji-arq"><IconoCategoria nombre={a.icono} size={16} /></span>
                {a.nombre}
              </button>
            ))}
          </div>
          <p className="ayuda-modal">
            Decide qué plantilla visual ve el vecino en la ficha de cada negocio de esta categoría. Se
            gestionan desde el módulo Arquetipos.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCerrar}>
            Cerrar
          </button>
          <button className="btn-crear" disabled={!nombre.trim() || guardando} onClick={guardar}>
            {guardando ? "Guardando…" : categoria ? "Guardar cambios" : "Crear categoría"}
          </button>
        </div>
      </div>
    </div>
  );
}
