import { useEffect, useMemo, useRef, useState } from "react";
import { AtributoProductoDef, Categoria, FICHAS, ServicioApp, TIPOS_FICHA, TipoFicha, tituloSeccionFicha } from "@app-vecinos/tipos";
import { LuEye, LuEyeOff, LuPlus, LuX } from "react-icons/lu";
import { useCategorias } from "../estado/useCategorias";
import { useNegocios } from "../estado/useNegocios";
import { useServiciosApp } from "../estado/useServiciosApp";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { IconoCategoria } from "../componentes/IconoCategoria";
import { SelectorIcono } from "../componentes/SelectorIcono";
import { TarjetaFicha } from "../componentes/fichas/TarjetaFicha";
import { TelefonoFicha } from "../componentes/fichas/TelefonoFicha";
import { useNegocioEjemplo } from "../componentes/fichas/useNegocioEjemplo";
import { urlCompleta } from "../utilidades/media";
import { IconoEmoji } from "../componentes/IconoEmoji";

export function Categorias() {
  const categorias = useCategorias((estado) => estado.categorias);
  const cargar = useCategorias((estado) => estado.cargar);
  const negocios = useNegocios((estado) => estado.negocios);
  const servicios = useServiciosApp((estado) => estado.servicios);
  const cargarServicios = useServiciosApp((estado) => estado.cargar);
  const token = useSesionAdmin((estado) => estado.token)!;

  useEffect(() => {
    cargar();
    cargarServicios();
  }, [cargar, cargarServicios]);

  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);

  const servicioPorSlug = useMemo(() => Object.fromEntries(servicios.map((s) => [s.slug, s])), [servicios]);

  const resumen = useMemo(() => {
    const propias = categorias.filter((c) => c.ficha).length;
    const sinServicio = categorias.filter((c) => !c.servicioSlug).length;
    const negociosCategorizados = new Set(negocios.flatMap((n) => n.categoriaIds)).size;
    return { total: categorias.length, propias, heredan: categorias.length - propias, sinServicio, negociosCategorizados };
  }, [categorias, negocios]);

  const categoriasFiltradas = categorias.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Categorías</h2>
          <p>
            {resumen.total} categoría{resumen.total === 1 ? "" : "s"}. Aquí se arma la ficha de cada una: el celular muestra cómo
            queda.
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
          <div className="icono" style={{ background: "var(--verde-suave)" }}>
            <IconoEmoji e="🗂️" />
          </div>
          <div>
            <b>{resumen.total}</b>
            <span>Categorías</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>
            <IconoEmoji e="✅" />
          </div>
          <div>
            <b>{resumen.heredan}</b>
            <span>Heredan la ficha del servicio</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--oro-suave)" }}>
            <IconoEmoji e="⚙️" />
          </div>
          <div>
            <b>{resumen.propias}</b>
            <span>Con ficha propia</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--rojo-suave)" }}>
            <IconoEmoji e="⚠️" />
          </div>
          <div>
            <b>{resumen.sinServicio}</b>
            <span>Sin servicio</span>
          </div>
        </div>
      </div>

      <div className="buscador-mini" style={{ marginBottom: 18, boxShadow: "var(--sombra)" }}>
        <IconoEmoji e="🔍" />
        <input placeholder="Buscar categoría por nombre…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <div className="grid-categorias">
        {categoriasFiltradas.map((cat) => {
          const ficha = cat.fichaEfectiva ?? "galeria";
          return (
            <div
              className={`tarjeta-cat ${cat.servicioSlug ? "" : "atencion"}`}
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
                    background: cat.fotoUrl ? "transparent" : "var(--superficie-hundida)",
                    color: "var(--texto-suave)",
                    overflow: "hidden",
                  }}
                >
                  {cat.fotoUrl ? (
                    <img src={urlCompleta(cat.fotoUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className={`badge-ficha ${cat.ficha ? "propia" : ""}`} title={cat.ficha ? "Ficha propia" : "Heredada del servicio"}>
                  {FICHAS[ficha].nombre}
                  {cat.ficha ? " · propia" : ""}
                </span>
                <span className={`badge-servicio ${cat.servicioSlug ? "" : "atencion"}`}>
                  {cat.servicioSlug ? servicioPorSlug[cat.servicioSlug]?.nombre ?? cat.servicioSlug : "Sin servicio"}
                </span>
              </div>
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
        <EditorCategoria
          categoria={editando}
          servicios={servicios}
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

/** Un campo extra mientras se edita: `clave` vacía = campo nuevo (la API la genera). */
type CampoEditable = { clave: string; etiqueta: string; tipo: AtributoProductoDef["tipo"]; opciones: string; oculto: boolean };

function aEditables(campos: AtributoProductoDef[] | undefined): CampoEditable[] {
  return (campos ?? []).map((c) => ({
    clave: c.clave,
    etiqueta: c.etiqueta,
    tipo: c.tipo,
    opciones: (c.opciones ?? []).join(", "),
    oculto: Boolean(c.oculto),
  }));
}

function aDefiniciones(campos: CampoEditable[]): AtributoProductoDef[] {
  return campos
    .filter((c) => c.etiqueta.trim())
    .map((c) => ({
      clave: c.clave,
      etiqueta: c.etiqueta.trim(),
      tipo: c.tipo,
      ...(c.tipo === "opciones"
        ? { opciones: c.opciones.split(",").map((o) => o.trim()).filter(Boolean) }
        : {}),
      ...(c.oculto ? { oculto: true } : {}),
    }));
}

function EditorCategoria({
  categoria,
  servicios,
  token,
  onCerrar,
}: {
  categoria: Categoria | null;
  servicios: ServicioApp[];
  token: string;
  onCerrar: () => void;
}) {
  const crear = useCategorias((estado) => estado.crear);
  const actualizar = useCategorias((estado) => estado.actualizar);
  const subirFoto = useCategorias((estado) => estado.subirFoto);
  const inputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [icono, setIcono] = useState(categoria?.icono ?? "pricetag-outline");
  const [servicioSlug, setServicioSlug] = useState(categoria?.servicioSlug ?? "");
  const [fichaPropia, setFichaPropia] = useState<TipoFicha | null>(categoria?.ficha ?? null);
  const [tituloSeccion, setTituloSeccion] = useState(categoria?.tituloSeccion ?? "");
  const [campos, setCampos] = useState<CampoEditable[]>(() => aEditables(categoria?.atributosProducto));
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const servicio = servicios.find((s) => s.slug === servicioSlug) ?? null;
  const fichaServicio: TipoFicha = servicio?.ficha ?? "galeria";
  const ficha: TipoFicha = fichaPropia ?? fichaServicio;
  const definiciones = useMemo(() => aDefiniciones(campos), [campos]);
  const usaCampos = FICHAS[ficha].usaProductos;

  // Datos reales para el celular: un negocio publicado de esta categoría.
  const ejemplo = useNegocioEjemplo(categoria ? [categoria.id] : [], ficha, token);

  const huboCambio =
    !categoria ||
    nombre.trim() !== categoria.nombre ||
    icono !== categoria.icono ||
    (servicioSlug || null) !== categoria.servicioSlug ||
    fichaPropia !== (categoria.ficha ?? null) ||
    tituloSeccion.trim() !== (categoria.tituloSeccion ?? "") ||
    JSON.stringify(definiciones) !== JSON.stringify(aDefiniciones(aEditables(categoria.atributosProducto)));

  function cambiarCampo(i: number, cambios: Partial<CampoEditable>) {
    setCampos((lista) => lista.map((c, j) => (j === i ? { ...c, ...cambios } : c)));
  }

  async function guardar() {
    if (!nombre.trim()) return;
    setGuardando(true);
    const datos = {
      nombre: nombre.trim(),
      icono,
      servicioSlug: servicioSlug || null,
      ficha: fichaPropia,
      tituloSeccion: tituloSeccion.trim() || null,
      atributosProducto: definiciones,
    };
    const ok = categoria ? await actualizar(categoria.id, datos, token) : await crear(datos, token);
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
      <div className="modal-card modal-con-telefono" onClick={(e) => e.stopPropagation()}>
        <div className="modal-con-telefono-form">
          <h3>{categoria ? `Editar "${categoria.nombre}"` : "Nueva categoría"}</h3>
          <p className="sub">El celular de la derecha muestra cómo verán los vecinos la ficha de un negocio de esta categoría.</p>

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

          <div className="fila-2-campos">
            <div className="campo-modal">
              <label htmlFor="cat-nombre">Nombre</label>
              <input id="cat-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Gimnasios" autoFocus />
            </div>
            <div className="campo-modal">
              <label htmlFor="cat-servicio">Servicio al que pertenece</label>
              <select id="cat-servicio" value={servicioSlug} onChange={(e) => setServicioSlug(e.target.value)}>
                <option value="">— Sin asignar —</option>
                {servicios.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="fila-2-campos">
            <div className="campo-modal">
              <label>Foto de la tarjeta en Inicio</label>
              <div className="selector-imagen">
                <div className="slot-imagen">
                  {categoria?.fotoUrl ? <img src={urlCompleta(categoria.fotoUrl)} alt="" /> : <IconoCategoria nombre={icono} size={22} />}
                </div>
                <div>
                  {categoria ? (
                    <button type="button" disabled={subiendo} onClick={() => inputRef.current?.click()}>
                      {subiendo ? "Subiendo…" : categoria.fotoUrl ? "Cambiar foto" : "Subir foto"}
                    </button>
                  ) : (
                    <p>Podrás subirla apenas guardes la categoría.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="campo-modal">
              <label>Ícono de respaldo</label>
              <SelectorIcono value={icono} onChange={setIcono} />
            </div>
          </div>

          <div className="campo-modal">
            <label>Ficha</label>
            <div className="opciones-ubicacion">
              <label className={`opcion-ubicacion ${fichaPropia === null ? "marcada" : ""}`}>
                <input type="radio" name="modo-ficha" checked={fichaPropia === null} onChange={() => setFichaPropia(null)} />
                <div>
                  <b>
                    Usar la del servicio: {servicio?.ficha ? FICHAS[servicio.ficha].nombre : "Galería"}
                  </b>
                  <span>
                    {servicio
                      ? `Si ${servicio.nombre} cambia de ficha, esta categoría cambia con él.`
                      : "Sin servicio asignado se usa la galería de fotos."}
                  </span>
                </div>
              </label>
              <label className={`opcion-ubicacion ${fichaPropia !== null ? "marcada" : ""}`}>
                <input
                  type="radio"
                  name="modo-ficha"
                  checked={fichaPropia !== null}
                  onChange={() => setFichaPropia(fichaServicio)}
                />
                <div>
                  <b>Elegir otra ficha para esta categoría</b>
                  <span>Queda fija aunque el servicio cambie.</span>
                </div>
              </label>
            </div>
            {fichaPropia !== null ? (
              <div className="grid-fichas compacta">
                {TIPOS_FICHA.map((f) => (
                  <TarjetaFicha key={f} ficha={f} compacta seleccionada={f === fichaPropia} onElegir={() => setFichaPropia(f)} />
                ))}
              </div>
            ) : null}
          </div>

          <div className="campo-modal">
            <label htmlFor="cat-titulo">Título de la sección</label>
            <input
              id="cat-titulo"
              value={tituloSeccion}
              maxLength={40}
              onChange={(e) => setTituloSeccion(e.target.value)}
              placeholder={FICHAS[ficha].tituloPorDefecto}
            />
            <p className="ayuda-modal">Lo que ven los vecinos encima de la lista. Vacío usa el de la ficha: "{FICHAS[ficha].tituloPorDefecto}".</p>
          </div>

          <div className="campo-modal">
            <label>Campos extra de los productos</label>
            {usaCampos ? (
              <>
                <p className="ayuda-modal" style={{ marginTop: 0 }}>
                  Datos que el dueño completa en cada producto (talla, color, nivel de picante…). Ocultar un campo deja de pedirlo y
                  mostrarlo, sin borrar lo ya cargado.
                </p>
                {campos.length ? (
                  <div className="campos-extra">
                    <div className="campo-extra cabecera">
                      <span>Nombre</span>
                      <span>Tipo</span>
                      <span>Opciones</span>
                      <span />
                    </div>
                    {campos.map((c, i) => (
                      <div className={`campo-extra ${c.oculto ? "oculto" : ""}`} key={c.clave || `nuevo-${i}`}>
                        <input
                          aria-label="Nombre del campo"
                          value={c.etiqueta}
                          maxLength={40}
                          onChange={(e) => cambiarCampo(i, { etiqueta: e.target.value })}
                        />
                        <select
                          aria-label="Tipo"
                          value={c.tipo}
                          onChange={(e) => cambiarCampo(i, { tipo: e.target.value as CampoEditable["tipo"] })}
                        >
                          <option value="opciones">Opciones</option>
                          <option value="texto">Texto libre</option>
                          <option value="color">Color</option>
                        </select>
                        <input
                          aria-label="Opciones"
                          value={c.tipo === "opciones" ? c.opciones : ""}
                          disabled={c.tipo !== "opciones"}
                          placeholder={c.tipo === "opciones" ? "Separadas por comas" : "No aplica"}
                          onChange={(e) => cambiarCampo(i, { opciones: e.target.value })}
                        />
                        <span className="acciones-campo">
                          <button
                            type="button"
                            className="icono-campo"
                            title={c.oculto ? "Mostrar" : "Ocultar"}
                            aria-label={c.oculto ? `Mostrar ${c.etiqueta}` : `Ocultar ${c.etiqueta}`}
                            onClick={() => cambiarCampo(i, { oculto: !c.oculto })}
                          >
                            {c.oculto ? <LuEyeOff /> : <LuEye />}
                          </button>
                          {/* Un campo ya guardado no se borra: sus valores quedan en los productos. Se oculta. */}
                          {c.clave ? null : (
                            <button
                              type="button"
                              className="icono-campo"
                              aria-label={`Quitar ${c.etiqueta}`}
                              onClick={() => setCampos((lista) => lista.filter((_, j) => j !== i))}
                            >
                              <LuX />
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="btn-accion-mini"
                  style={{ marginTop: 8 }}
                  disabled={campos.length >= 12}
                  onClick={() => setCampos((lista) => [...lista, { clave: "", etiqueta: "", tipo: "opciones", opciones: "", oculto: false }])}
                >
                  <LuPlus /> Agregar campo
                </button>
              </>
            ) : (
              <p className="nota-info" style={{ marginTop: 0 }}>
                La ficha {FICHAS[ficha].nombre} no usa productos, así que no tiene campos extra.
                {campos.length ? " Los campos que ya tenía se conservan por si vuelves a Menú o Catálogo." : ""}
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-cancelar" onClick={onCerrar}>
              Cerrar
            </button>
            <button className="btn-crear" disabled={!nombre.trim() || guardando || !huboCambio} onClick={guardar}>
              {guardando ? "Guardando…" : categoria ? "Guardar cambios" : "Crear categoría"}
            </button>
          </div>
        </div>

        <aside className="columna-telefono">
          <p className="rotulo-telefono">
            Así se ve <b>{nombre.trim() || "la categoría"}</b> en la app
          </p>
          <TelefonoFicha
            ficha={ficha}
            titulo={tituloSeccionFicha(ficha, tituloSeccion)}
            campos={usaCampos ? definiciones : []}
            rotulo={nombre.trim() || "Categoría"}
            negocio={ejemplo.negocio}
            productos={ejemplo.productos}
            cargando={ejemplo.cargando}
          />
          <p className="leyenda-telefono">
            {ejemplo.negocio ? `Negocio de ejemplo: ${ejemplo.negocio.nombre}` : "Todavía no hay negocios en esta categoría: se muestra contenido de ejemplo."}
            <br />
            Ficha <span className="pill pill-verde">{FICHAS[ficha].nombre}</span> {fichaPropia ? "propia" : "heredada del servicio"}
          </p>
        </aside>
      </div>
    </div>
  );
}
