import { useEffect, useRef, useState } from "react";
import { EnfoqueVistaPrevia } from "../../estado/useBorradorNegocio";
import { Categoria, FICHAS, Negocio, Producto } from "@app-vecinos/tipos";
import { LuChevronLeft, LuHeart, LuMapPin, LuPhone, LuSearch, LuStar } from "react-icons/lu";
import { urlCompleta } from "../../utilidades/media";
import { fichaDelNegocio } from "../../utilidades/fichaNegocio";
import { estadoHoyTexto, resumenSemana } from "../../utilidades/horarios";
import { AvisoTelefono, Contenido } from "./TelefonoFicha";

function iniciales(nombre: string) {
  return (
    nombre
      .split(" ")
      .filter((p) => p.length > 2)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "N"
  );
}

/** "★ 4,7 (12)" o "★ Califica" cuando todavía no tiene reseñas, como en la app. */
function Calificacion({ negocio }: { negocio: Negocio }) {
  return (
    <span className="vp-calif">
      <LuStar />
      {negocio.calificacionPromedio ? (
        <>
          {negocio.calificacionPromedio.toFixed(1).replace(".", ",")} <i>({negocio.calificacionTotal})</i>
        </>
      ) : (
        "Califica"
      )}
    </span>
  );
}

function PantallaFicha({ negocio, categorias, productos }: { negocio: Negocio; categorias: Categoria[]; productos: Producto[] }) {
  const { ficha, categoria, titulo } = fichaDelNegocio(negocio, categorias);
  const hoy = estadoHoyTexto(negocio.horarios);
  const semana = resumenSemana(negocio.horarios);
  const portada = urlCompleta(negocio.fotoPrincipalUrl);
  const nombre = negocio.nombre.trim() || "Nombre del negocio";
  const sinBuscador = ficha === "galeria" || ficha === "rubros";
  const botones = [negocio.whatsapp ? "whatsapp" : null, negocio.telefono ? "llamar" : null].filter(Boolean);

  return (
    <>
      <div className="tf-portada" style={portada ? { backgroundImage: `url(${portada})` } : undefined}>
        {portada ? null : <span className="tf-ini">{iniciales(nombre)}</span>}
        <span className="tf-bot izq">
          <LuChevronLeft />
        </span>
        <span className="tf-bot der">
          <LuHeart />
        </span>
      </div>
      <div className="tf-cuerpo">
        <div className="tf-eyebrow">{categoria?.nombre ?? "Sin categoría"}</div>
        <div className="tf-nombre">
          {nombre}
          {negocio.verificadoEn ? <span className="vp-verificado" title="Verificado">✓</span> : null}
        </div>
        <div className="vp-meta">
          <Calificacion negocio={negocio} /> · <span className={`vp-punto ${hoy.abierto ? "abierto" : ""}`} />{" "}
          {hoy.abierto
            ? `Abierto, ${hoy.detalle}`
            : hoy.detalle.startsWith("Abre")
              ? `Cerrado, ${hoy.detalle.charAt(0).toLowerCase()}${hoy.detalle.slice(1)}`
              : hoy.detalle}
        </div>
        {negocio.descripcion.trim() ? <p className="tf-desc">{negocio.descripcion}</p> : <p className="tf-desc vp-falta">Sin descripción todavía.</p>}
        {categoria?.avisoFicha ? <AvisoTelefono aviso={categoria.avisoFicha} /> : null}

        {botones.length ? (
          <div className="tf-btns" style={botones.length === 1 ? { gridTemplateColumns: "1fr" } : undefined}>
            {negocio.whatsapp ? <span className="tf-btn verde">WhatsApp</span> : null}
            {negocio.telefono ? (
              <span className="tf-btn">
                <LuPhone /> Llamar
              </span>
            ) : null}
          </div>
        ) : (
          <p className="vp-aviso">Sin teléfono ni WhatsApp: los vecinos no tendrán cómo contactarlo.</p>
        )}

        {sinBuscador ? null : (
          <div className="tf-busca">
            <LuSearch /> Buscar en este negocio
          </div>
        )}
        <div className="tf-tit" data-enfoque="contenido">
          {titulo}
        </div>
        <Contenido
          ficha={ficha}
          negocio={negocio}
          productos={productos}
          campos={FICHAS[ficha].usaProductos ? categoria?.atributosProducto ?? [] : []}
          moneda={negocio.moneda}
        />

        <div className="tf-tit vp-seccion">Ubicación</div>
        <div className="vp-mapa">
          <LuMapPin />
        </div>
        <div className="vp-direccion">{negocio.direccion.trim() || <span className="vp-falta">Sin dirección</span>}</div>

        <div className="tf-tit vp-seccion" data-enfoque="horario">
          Horario
        </div>
        <div className="vp-hoy">
          <span className={`vp-punto ${hoy.abierto ? "abierto" : ""}`} /> <b>{hoy.abierto ? "Abierto ahora" : "Cerrado"}</b>
          {` · ${hoy.detalle}`}
        </div>
        <div className="vp-semana">
          {semana.map((d) => (
            <span key={d.dia} className={`${d.esHoy ? "hoy" : ""} ${d.abierto ? "" : "cerrado"}`}>
              {d.abreviatura}
            </span>
          ))}
        </div>

        {negocio.acercaDelNegocio?.trim() ? (
          <>
            <div className="tf-tit vp-seccion">Acerca del negocio</div>
            <p className="tf-desc">{negocio.acercaDelNegocio}</p>
          </>
        ) : null}
      </div>
    </>
  );
}

/** Cómo aparece el negocio en los listados de la app (Inicio, Guía, su servicio). */
function PantallaListado({ negocio, categorias }: { negocio: Negocio; categorias: Categoria[] }) {
  const { categoria } = fichaDelNegocio(negocio, categorias);
  const hoy = estadoHoyTexto(negocio.horarios);
  const portada = urlCompleta(negocio.fotoPrincipalUrl);
  const nombre = negocio.nombre.trim() || "Nombre del negocio";
  return (
    <div className="tf-cuerpo vp-listado">
      <div className="vp-listado-cab">San Borja</div>
      <div className="tf-nombre">¿Qué buscas hoy?</div>
      <div className="tf-busca">
        <LuSearch /> Negocio, plato o producto
      </div>
      <div className="tf-tit">Negocios cerca de ti</div>
      <div className="vp-tarjetas">
        <div className="vp-tarjeta">
          <div className="vp-tarjeta-foto" style={portada ? { backgroundImage: `url(${portada})` } : undefined}>
            {portada ? null : iniciales(nombre)}
          </div>
          <b>{nombre}</b>
          <span>
            <span className={`vp-punto ${hoy.abierto ? "abierto" : ""}`} /> {hoy.abierto ? "abierto" : "cerrado"}
            {categoria ? ` · ${categoria.nombre}` : ""}
          </span>
        </div>
        <div className="vp-tarjeta fantasma">
          <div className="vp-tarjeta-foto" />
          <b>Otro negocio</b>
          <span>…</span>
        </div>
      </div>
      <p className="tf-nota">La foto de portada y el nombre son lo primero que ven los vecinos.</p>
    </div>
  );
}

/**
 * El apartado del negocio en la app, completo y en vivo: lo que se está escribiendo en el
 * registro o en cualquier pestaña de edición se ve aquí antes de guardar. "Ficha" = la pantalla
 * del negocio; "En el listado" = su tarjeta en Inicio y en los listados.
 */
export function VistaPreviaNegocio({
  negocio,
  categorias,
  productos,
  sinGuardar = false,
  enfoque = "arriba",
}: {
  negocio: Negocio;
  categorias: Categoria[];
  productos: Producto[];
  sinGuardar?: boolean;
  /** Parte de la ficha que se está editando: la pantalla se desplaza hasta ahí. */
  enfoque?: EnfoqueVistaPrevia;
}) {
  const [vista, setVista] = useState<"ficha" | "listado">("ficha");
  const pantalla = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pantalla.current;
    if (!el || vista !== "ficha") return;
    const destino = enfoque === "arriba" ? null : el.querySelector<HTMLElement>(`[data-enfoque="${enfoque}"]`);
    el.scrollTo({ top: destino ? destino.offsetTop - 12 : 0, behavior: "smooth" });
  }, [enfoque, vista]);
  return (
    <aside className="columna-telefono vista-previa-negocio" aria-label="Vista previa en la app">
      <div className="vp-conmutador" role="tablist">
        <button type="button" role="tab" aria-selected={vista === "ficha"} onClick={() => setVista("ficha")}>
          Ficha
        </button>
        <button type="button" role="tab" aria-selected={vista === "listado"} onClick={() => setVista("listado")}>
          En el listado
        </button>
      </div>
      <div className="tf-telefono">
        <div className="tf-pantalla" ref={pantalla}>
          {vista === "ficha" ? (
            <PantallaFicha negocio={negocio} categorias={categorias} productos={productos} />
          ) : (
            <PantallaListado negocio={negocio} categorias={categorias} />
          )}
        </div>
      </div>
      <p className="leyenda-telefono">
        {sinGuardar ? (
          <>
            <b className="vp-sin-guardar">Con cambios sin guardar.</b> Así quedará al guardar.
          </>
        ) : (
          "Así lo ven los vecinos en la app."
        )}
      </p>
    </aside>
  );
}
