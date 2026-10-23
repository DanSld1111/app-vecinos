import { ReactNode, useEffect, useRef, useState } from "react";
import {
  AtributoProductoDef,
  AvisoFicha,
  FICHAS,
  Mascota,
  Moneda,
  Negocio,
  Producto,
  TipoFicha,
  edadMascota,
  formatearPrecio,
  tamanoMascota,
} from "@app-vecinos/tipos";
import { LuHeart, LuChevronLeft, LuPhone, LuSearch, LuTag } from "react-icons/lu";
import { urlCompleta } from "../../utilidades/media";

/** Contenido de ejemplo para cuando el negocio de muestra no cargó lo que pide esta ficha. */
const EJEMPLO = {
  productos: [
    { nombre: "Producto destacado", descripcion: "Descripción corta del producto.", precio: 45, seccion: "Principales" },
    { nombre: "Segundo producto", descripcion: "Con su precio y su foto.", precio: 32, seccion: "Principales" },
    { nombre: "Otro producto", descripcion: "En otra sección.", precio: 18, seccion: "Otros" },
  ],
  servicios: [
    { nombre: "Servicio principal", detalle: "Detalle corto", precio: 80 },
    { nombre: "Segundo servicio", detalle: "Duración o condiciones", precio: 120 },
    { nombre: "Servicio adicional", detalle: "Opcional", precio: 40 },
  ],
  rubros: ["Rubro uno", "Rubro dos", "Rubro tres", "Rubro cuatro"],
  ofertas: [
    { nombre: "Producto en oferta", precio: 9.9, precioOriginal: 12.5, etiqueta: "Oferta" },
    { nombre: "Oferta del día", precio: 5.5, etiqueta: "Del día" },
  ],
  pasillos: ["Pasillo uno", "Pasillo dos", "Pasillo tres"],
};

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/** Igual que en la app (apps/movil/src/utilidades/fichaNegocio.ts): insignias y filtro por un campo. */
const normalizar = (t: string) => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function insigniasDe(valores: Record<string, string>, campos: AtributoProductoDef[]) {
  return campos.filter((c) => c.insignia && !c.oculto && normalizar(valores[c.clave] ?? "") === "si").map((c) => c.etiqueta);
}
function sufijoPrecio(valores: Record<string, string>, campos: AtributoProductoDef[]) {
  const campo = campos.find((c) => c.sufijoPrecio && !c.oculto && valores[c.clave] === c.sufijoPrecio.opcion);
  return campo ? ` ${campo.sufijoPrecio!.sufijo}` : "";
}
function filtroDeCampos(campos: AtributoProductoDef[]) {
  const campo = campos.find((c) => c.filtro && !c.oculto && c.tipo === "opciones" && (c.opciones?.length ?? 0) > 1);
  if (!campo) return null;
  const todas = campo.opciones ?? [];
  return todas.filter((o) => !todas.some((otra) => otra !== o && normalizar(o).includes(normalizar(otra))));
}

/** El aviso de la categoría bajo la descripción ("+18", receta o informativo). */
export function AvisoTelefono({ aviso }: { aviso: AvisoFicha }) {
  const corte = aviso.texto.indexOf(". ");
  return (
    <div className={`tf-aviso ${aviso.tipo}`}>
      <span className="tf-aviso-circulo">{aviso.tipo === "mayores18" ? "+18" : aviso.tipo === "receta" ? "Rx" : "i"}</span>
      <span>
        <b>{corte > 0 ? aviso.texto.slice(0, corte + 1) : aviso.texto}</b>
        {corte > 0 ? aviso.texto.slice(corte + 1) : ""}
      </span>
    </div>
  );
}

function Atributos({ valores, campos }: { valores: Record<string, string>; campos: AtributoProductoDef[] }) {
  const visibles = campos.filter((c) => !c.oculto && !c.insignia);
  if (visibles.length === 0) return null;
  return (
    <div className="tf-attrs">
      {visibles.map((c, i) => {
        // Si el producto de muestra no tiene ese dato, se muestra un valor de ejemplo para que se
        // vea dónde aparece el campo.
        const valor = valores[c.clave] || (c.tipo === "opciones" ? c.opciones?.[0] : c.tipo === "color" ? "Negro" : "…");
        return (
          <span key={c.clave || `nuevo-${i}`} className="tf-attr">
            <i>{c.etiqueta || "Campo"}:</i> {valor || "…"}
          </span>
        );
      })}
    </div>
  );
}

/** Carrusel de ofertas que se desliza hasta la última al agregar una (la que se está escribiendo). */
function Carrusel({ cantidad, children }: { cantidad: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const anterior = useRef(cantidad);
  useEffect(() => {
    if (cantidad > anterior.current && ref.current) ref.current.scrollLeft = ref.current.scrollWidth;
    anterior.current = cantidad;
  }, [cantidad]);
  return (
    <div className="tf-carrusel" ref={ref}>
      {children}
    </div>
  );
}

/** "3 dormitorios", "120 m²": un campo Número con su valor (igual que en la app). */
function textoNumero(campo: AtributoProductoDef, valor: string) {
  if (campo.unidad) return `${valor} ${campo.unidad}`;
  const etiqueta = campo.etiqueta.toLowerCase();
  return `${valor} ${valor === "1" ? etiqueta.replace(/s$/, "") : etiqueta}`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
function fechaCorta(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${DIAS[new Date(a, m - 1, d).getDay()]} ${d} ${MESES[m - 1]}`;
}

/** Mascotas de ejemplo para la vista previa de un albergue que todavía no cargó ninguna. */
const MASCOTAS_EJEMPLO: Pick<Mascota, "id" | "nombre" | "sexo" | "edadValor" | "edadUnidad" | "tamano" | "fotoUrl" | "urgente">[] = [
  { id: "e1", nombre: "Canela", sexo: "hembra", edadValor: 2, edadUnidad: "anios", tamano: "mediano", fotoUrl: null, urgente: false },
  { id: "e2", nombre: "Toby", sexo: "macho", edadValor: 5, edadUnidad: "meses", tamano: "pequeno", fotoUrl: null, urgente: false },
  { id: "e3", nombre: "Negro", sexo: "macho", edadValor: 9, edadUnidad: "anios", tamano: "grande", fotoUrl: null, urgente: true },
  { id: "e4", nombre: "Michi", sexo: "macho", edadValor: 1, edadUnidad: "anios", tamano: "pequeno", fotoUrl: null, urgente: false },
];

function NotaEjemplo({ que }: { que: string }) {
  return <p className="tf-nota">Contenido de ejemplo: este negocio todavía no cargó {que}.</p>;
}

/** El bloque de contenido de una ficha (menú, catálogo, servicios…). También lo usa VistaPreviaNegocio. */
export function Contenido({
  ficha,
  negocio,
  productos,
  campos,
  moneda,
  mascotas,
}: {
  ficha: TipoFicha;
  negocio: Negocio | null;
  productos: Producto[];
  campos: AtributoProductoDef[];
  moneda: Moneda;
  /** Solo la ficha Mascotas (decisión 0097): las que ya cargó el albergue. */
  mascotas?: Mascota[];
}) {
  const precio = (n: number, propia?: Moneda | null) => formatearPrecio(n, propia ?? moneda);
  const visibles = (campos ?? []).filter((c) => !c.oculto);

  // Decisión 0096: tarjeta grande con precio, números y Venta / Alquiler arriba.
  if (ficha === "inmuebles") {
    const reales = productos.length > 0;
    const numeros = visibles.filter((c) => c.tipo === "numero");
    const opciones = visibles.filter((c) => c.tipo === "opciones");
    const ejemploValores: Record<string, string> = Object.fromEntries([
      ...numeros.map((c, i) => [c.clave, ["3", "2", "120", "1"][i] ?? "1"]),
      ...opciones.map((c) => [c.clave, c.opciones?.[0] ?? ""]),
    ]);
    const items = reales
      ? productos.map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, moneda: p.moneda ?? null, foto: urlCompleta(p.fotoUrl), valores: p.atributos ?? {} }))
      : [{ id: "e", nombre: "Casa en venta con jardín", precio: 350000, moneda: null as Moneda | null, foto: undefined, valores: ejemploValores }];
    const segmentos = filtroDeCampos(campos);
    const primeraOpcion = opciones.find((c) => c.filtro);
    return (
      <>
        {segmentos ? (
          <div className="tf-segmentos">
            {["Todos", ...segmentos].map((s, i) => (
              <span key={s} className={i === 0 ? "activo" : ""}>
                {s}
              </span>
            ))}
          </div>
        ) : null}
        {items.slice(0, 3).map((p) => (
          <div className="tf-inmueble" key={p.id}>
            <div className="tf-inmueble-img" style={p.foto ? { backgroundImage: `url(${p.foto})` } : undefined}>
              {primeraOpcion && p.valores[primeraOpcion.clave] ? <em className="tf-insignia verde">{p.valores[primeraOpcion.clave]}</em> : null}
            </div>
            <div className="tf-card-txt">
              <span className="tf-precio grande">
                {precio(p.precio, p.moneda)}
                {sufijoPrecio(p.valores, campos)}
              </span>
              <b>{p.nombre}</b>
              <span className="tf-specs">
                {numeros
                  .filter((c) => p.valores[c.clave])
                  .slice(0, 3)
                  .map((c) => textoNumero(c, p.valores[c.clave]))
                  .join(" · ")}
              </span>
            </div>
          </div>
        ))}
        {reales ? null : <NotaEjemplo que="inmuebles" />}
      </>
    );
  }

  // Decisión 0096: filas con la próxima salida y el precio por persona.
  if (ficha === "tours") {
    const reales = productos.length > 0;
    const hoy = new Date().toLocaleDateString("en-CA");
    const tipo = visibles.find((c) => c.filtro && c.tipo === "opciones");
    const items = reales
      ? productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: p.precio,
          moneda: p.moneda ?? null,
          foto: urlCompleta(p.fotoUrl),
          tipo: tipo ? p.atributos?.[tipo.clave] : undefined,
          salida: [...(p.detalle?.salidas ?? [])].filter((s) => s.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))[0],
        }))
      : [{ id: "e", nombre: "Full day Paracas y Huacachina", precio: 129, moneda: null as Moneda | null, foto: undefined, tipo: tipo?.opciones?.[0], salida: { fecha: hoy, hora: "04:30", cupos: 3 } }];
    return (
      <>
        {items.slice(0, 4).map((t) => (
          <div className="tf-item" key={t.id}>
            <div className="tf-ft grande" style={t.foto ? { backgroundImage: `url(${t.foto})` } : undefined}>
              {t.foto ? null : <LuTag />}
            </div>
            <div className="tf-inf">
              {t.tipo ? <em className="tf-chip-tipo">{t.tipo}</em> : null}
              <b>{t.nombre}</b>
              <span>{t.salida ? `Sale ${fechaCorta(t.salida.fecha)}` : "Sin fechas de salida"}</span>
              <span className="tf-precio">
                {precio(t.precio, t.moneda)} <i className="tf-pp">p. p.</i>
              </span>
            </div>
          </div>
        ))}
        {reales ? null : <NotaEjemplo que="tours" />}
      </>
    );
  }

  // Decisión 0097: las mascotas del albergue en grilla, con sexo, edad y tamaño.
  if (ficha === "mascotas") {
    const reales = Boolean(mascotas?.length);
    const items = reales ? mascotas!.filter((m) => m.estado !== "adoptada") : MASCOTAS_EJEMPLO;
    return (
      <>
        <div className="tf-grid">
          {items.slice(0, 6).map((m) => {
            const foto = urlCompleta(m.fotoUrl);
            return (
              <div className="tf-card" key={m.id}>
                <div className="tf-card-img alta" style={foto ? { backgroundImage: `url(${foto})` } : undefined}>
                  {foto ? null : m.nombre.slice(0, 1)}
                  {m.urgente ? <em className="tf-insignia rojo">Urgente</em> : null}
                </div>
                <div className="tf-card-txt">
                  <b>
                    {m.nombre} <i className={m.sexo === "hembra" ? "tf-hembra" : "tf-macho"}>{m.sexo === "hembra" ? "♀" : "♂"}</i>
                  </b>
                  <span className="tf-specs">
                    {edadMascota(m)} · {tamanoMascota(m)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {reales ? null : <NotaEjemplo que="mascotas" />}
      </>
    );
  }

  if (ficha === "menu" || ficha === "catalogo") {
    const reales = productos.length > 0;
    const items = reales
      ? productos.map((p) => ({ id: p.id, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, moneda: p.moneda ?? null, seccion: p.categoriaMenu, foto: urlCompleta(p.fotoUrl), valores: p.atributos ?? {} }))
      : EJEMPLO.productos.map((p, i) => ({ id: String(i), ...p, moneda: null as Moneda | null, foto: undefined, valores: {} as Record<string, string> }));
    if (ficha === "catalogo") {
      const [primero] = items;
      const segmentos = filtroDeCampos(campos);
      return (
        <>
          {segmentos ? (
            <div className="tf-segmentos">
              {["Todos", ...segmentos].map((s, i) => (
                <span key={s} className={i === 0 ? "activo" : ""}>
                  {s}
                </span>
              ))}
            </div>
          ) : null}
          <div className="tf-grid">
            {items.slice(0, 6).map((p) => (
              <div className="tf-card" key={p.id}>
                <div className="tf-card-img" style={p.foto ? { backgroundImage: `url(${p.foto})` } : undefined}>
                  {p.foto ? null : p.nombre.slice(0, 1)}
                  {insigniasDe(p.valores, campos).map((i) => (
                    <em key={i} className="tf-insignia">
                      {i}
                    </em>
                  ))}
                </div>
                <div className="tf-card-txt">
                  <b>{p.nombre}</b>
                  <span className="tf-precio">
                    {precio(p.precio, p.moneda)}
                    {sufijoPrecio(p.valores, campos)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {primero && campos.some((c) => !c.oculto) ? (
            <div className="tf-hoja">
              <span className="tf-hoja-rotulo">Al tocar un producto</span>
              <b>{primero.nombre}</b>
              <Atributos valores={primero.valores} campos={campos} />
            </div>
          ) : null}
          {reales ? null : <NotaEjemplo que="productos" />}
        </>
      );
    }
    const secciones = Array.from(new Set(items.map((p) => p.seccion)));
    return (
      <>
        {secciones.map((s) => (
          <div key={s}>
            <div className="tf-sub">{s}</div>
            {items
              .filter((p) => p.seccion === s)
              .map((p) => (
                <div className="tf-item" key={p.id}>
                  <div className="tf-ft" style={p.foto ? { backgroundImage: `url(${p.foto})` } : undefined}>
                    {p.foto ? null : <LuTag />}
                  </div>
                  <div className="tf-inf">
                    <b>{p.nombre}</b>
                    {p.descripcion ? <span>{p.descripcion}</span> : null}
                    <span className="tf-precio">
                      {precio(p.precio, p.moneda)}
                      {sufijoPrecio(p.valores, campos)}
                    </span>
                    <Atributos valores={p.valores} campos={campos} />
                  </div>
                </div>
              ))}
          </div>
        ))}
        {reales ? null : <NotaEjemplo que="productos" />}
      </>
    );
  }

  if (ficha === "servicios") {
    const reales = Boolean(negocio?.serviciosOfrecidos?.length);
    const items = reales
      ? negocio!.serviciosOfrecidos!.map((s) => ({ ...s, foto: urlCompleta(s.fotoUrl) }))
      : EJEMPLO.servicios.map((s) => ({ ...s, foto: undefined }));
    return (
      <>
        {items.map((s) => (
          <div className="tf-fila-serv" key={s.nombre}>
            <div className="tf-ft chico" style={s.foto ? { backgroundImage: `url(${s.foto})` } : undefined}>
              {s.foto ? null : <LuTag />}
            </div>
            <div className="tf-inf">
              <b>{s.nombre}</b>
              {s.detalle ? <span>{s.detalle}</span> : null}
            </div>
            <span className="tf-precio">{precio(s.precio)}</span>
          </div>
        ))}
        <p className="tf-nota">Tarifas referenciales. Confirma el precio final con el negocio.</p>
        {reales ? null : <NotaEjemplo que="servicios" />}
      </>
    );
  }

  if (ficha === "rubros") {
    const reales = Boolean(negocio?.rubrosDisponibles?.length);
    const rubros = reales ? negocio!.rubrosDisponibles! : EJEMPLO.rubros;
    return (
      <>
        <div className="tf-chips">
          {rubros.map((r) => (
            <span className="tf-rubro" key={r}>
              {r}
            </span>
          ))}
        </div>
        {reales ? null : <NotaEjemplo que="sus rubros" />}
      </>
    );
  }

  if (ficha === "ofertas") {
    const reales = Boolean(negocio?.ofertas?.length || negocio?.pasillos?.length);
    const ofertas = reales ? negocio!.ofertas ?? [] : EJEMPLO.ofertas;
    const pasillos = reales ? negocio!.pasillos ?? [] : EJEMPLO.pasillos;
    const foto = urlCompleta(negocio?.fotoPrincipalUrl);
    return (
      <>
        <Carrusel cantidad={ofertas.length}>
          {ofertas.map((o, i) => (
            <div className="tf-oferta" key={`${i}-${o.nombre}`}>
              <div className="tf-oferta-img" style={foto ? { backgroundImage: `url(${foto})` } : undefined}>
                <em>{o.etiqueta || "Oferta"}</em>
              </div>
              <div className="tf-card-txt">
                <b>{o.nombre}</b>
                <s>{o.precioOriginal ? precio(o.precioOriginal) : " "}</s>
                <span className="tf-precio">{precio(o.precio)}</span>
              </div>
            </div>
          ))}
        </Carrusel>
        {pasillos.length ? (
          <>
            <div className="tf-sub">Pasillos</div>
            <div className="tf-chips">
              {pasillos.map((p) => (
                <span className="tf-pasillo" key={p}>
                  {p}
                </span>
              ))}
            </div>
          </>
        ) : null}
        {reales ? null : <NotaEjemplo que="ofertas" />}
        {productos.length ? (
          <>
            <div className="tf-tit">Todo lo que vende</div>
            <Contenido ficha="menu" negocio={negocio} productos={productos} campos={campos} moneda={moneda} />
          </>
        ) : null}
      </>
    );
  }

  const fotos = (negocio?.fotosGaleria ?? []).map((f) => urlCompleta(f)).filter(Boolean) as string[];
  return (
    <>
      <div className="tf-gal">
        {fotos.length
          ? fotos.slice(0, 6).map((f) => <div key={f} style={{ backgroundImage: `url(${f})` }} />)
          : [0, 1, 2, 3].map((i) => (
              <div key={i} className="vacia">
                Foto {i + 1}
              </div>
            ))}
      </div>
      {fotos.length ? null : <NotaEjemplo que="fotos" />}
    </>
  );
}

/**
 * Un celular con la ficha de un negocio tal como la vería un vecino en la app, armada con la
 * configuración que se está editando (ficha, título y campos extra) y los datos de un negocio real
 * de esa categoría. Ver docs/decisiones/0080-fichas.md.
 */
export function TelefonoFicha({
  ficha,
  titulo,
  campos,
  rotulo,
  negocio,
  productos,
  cargando,
  aviso = null,
}: {
  ficha: TipoFicha;
  titulo: string;
  campos: AtributoProductoDef[];
  /** Aviso de la categoría (ej. "+18"), bajo la descripción. */
  aviso?: AvisoFicha | null;
  /** Texto sobre el nombre del negocio (la categoría). */
  rotulo: string;
  negocio: Negocio | null;
  productos: Producto[];
  cargando: boolean;
}) {
  // Un destello sobre el contenido cada vez que cambia la ficha, para que se note qué cambió.
  const [destello, setDestello] = useState(0);
  useEffect(() => setDestello((d) => d + 1), [ficha]);

  const nombre = negocio?.nombre ?? "Negocio de ejemplo";
  const portada = urlCompleta(negocio?.fotoPrincipalUrl);
  const sinBuscador = ficha === "galeria" || ficha === "rubros";

  return (
    <div className="tf-telefono" aria-label={`Vista previa de la ficha ${FICHAS[ficha].nombre}`}>
      <div className={`tf-pantalla ${cargando ? "cargando" : ""}`}>
        <div className="tf-portada" style={portada ? { backgroundImage: `url(${portada})` } : undefined}>
          {portada ? null : <span className="tf-ini">{iniciales(nombre) || "N"}</span>}
          <span className="tf-bot izq">
            <LuChevronLeft />
          </span>
          <span className="tf-bot der">
            <LuHeart />
          </span>
        </div>
        <div className="tf-cuerpo">
          <div className="tf-eyebrow">{rotulo}</div>
          <div className="tf-nombre">{nombre}</div>
          {negocio?.descripcion ? <p className="tf-desc">{negocio.descripcion}</p> : null}
          {aviso ? <AvisoTelefono aviso={aviso} /> : null}
          <div className="tf-btns">
            <span className="tf-btn verde">WhatsApp</span>
            <span className="tf-btn">
              <LuPhone /> Llamar
            </span>
          </div>
          {sinBuscador ? null : (
            <div className="tf-busca">
              <LuSearch /> Buscar en este negocio
            </div>
          )}
          <div key={`t${titulo}`} className="tf-tit destello">
            {titulo}
          </div>
          <div key={destello} className="tf-contenido destello">
            <Contenido ficha={ficha} negocio={negocio} productos={productos} campos={campos} moneda={negocio?.moneda ?? "PEN"} />
          </div>
        </div>
      </div>
    </div>
  );
}
