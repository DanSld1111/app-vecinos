import { useMemo, useState } from "react";
import { PlantillaVisual } from "@app-vecinos/tipos";
import { PLANTILLAS_VISUALES } from "../datos/plantillasVisuales";

export const NOMBRE_TIPO_CAMPO: Record<string, string> = {
  texto: "🔤 Texto corto",
  texto_largo: "📝 Texto largo",
  numero: "🔢 Número",
  precio: "💰 Precio",
  booleano: "✅ Sí / No",
  opciones: "📑 Lista de opciones",
  foto: "🖼️ Foto",
};

type Filtro = "todas" | "sistema" | "nueva" | "lista" | "unico";

export function Plantillas() {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [seleccionada, setSeleccionada] = useState<PlantillaVisual | null>(null);

  const resumen = useMemo(
    () => ({
      total: PLANTILLAS_VISUALES.length,
      sistema: PLANTILLAS_VISUALES.filter((p) => p.origen === "sistema").length,
      nuevas: PLANTILLAS_VISUALES.filter((p) => p.origen === "nueva").length,
      modoUnico: PLANTILLAS_VISUALES.filter((p) => p.modo === "unico").length,
    }),
    []
  );

  const plantillasFiltradas = PLANTILLAS_VISUALES.filter((p) => {
    if (filtro === "todas") return true;
    if (filtro === "sistema" || filtro === "nueva") return p.origen === filtro;
    return p.modo === filtro;
  });

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Plantillas</h2>
          <p>Cómo se dibuja el contenido de cada arquetipo — elige, no diseñes desde cero</p>
        </div>
      </div>

      <div className="resumen-mini">
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--verde-suave)" }}>🎨</div>
          <div>
            <b>{resumen.total}</b>
            <span>Plantillas disponibles</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--superficie-hundida)" }}>⚙️</div>
          <div>
            <b>{resumen.sistema}</b>
            <span>Del sistema (migradas)</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--morado-suave)" }}>✨</div>
          <div>
            <b>{resumen.nuevas}</b>
            <span>Nuevas</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="icono" style={{ background: "var(--azul-suave)" }}>🗂️</div>
          <div>
            <b>{resumen.modoUnico}</b>
            <span>Modo único</span>
          </div>
        </div>
      </div>

      <div className="nota-info">
        ℹ️ Cada plantilla ya trae su diseño resuelto — al crear un arquetipo solo eliges una de estas y conectas
        tus campos a lo que la plantilla espera. No se dibuja nada a mano.
      </div>

      <div className="fila-filtro" style={{ marginBottom: 16 }}>
        <button className={`chip-filtro ${filtro === "todas" ? "activo" : ""}`} onClick={() => setFiltro("todas")}>
          Todas ({resumen.total})
        </button>
        <button className={`chip-filtro ${filtro === "sistema" ? "activo" : ""}`} onClick={() => setFiltro("sistema")}>
          ⚙️ Del sistema ({resumen.sistema})
        </button>
        <button className={`chip-filtro ${filtro === "nueva" ? "activo" : ""}`} onClick={() => setFiltro("nueva")}>
          ✨ Nuevas ({resumen.nuevas})
        </button>
        <button className={`chip-filtro ${filtro === "lista" ? "activo" : ""}`} onClick={() => setFiltro("lista")}>
          📋 Modo lista
        </button>
        <button className={`chip-filtro ${filtro === "unico" ? "activo" : ""}`} onClick={() => setFiltro("unico")}>
          🗂️ Modo único
        </button>
      </div>

      <div className="grid-plantillas">
        {plantillasFiltradas.map((plantilla) => (
          <div className="tarjeta-plantilla" key={plantilla.id} onClick={() => setSeleccionada(plantilla)}>
            <div className="cabecera-plantilla">
              <div>
                <b>{plantilla.nombre}</b>
                <span className="modo-plantilla">{plantilla.modo === "lista" ? "📋 Modo lista" : "🗂️ Modo único"}</span>
              </div>
              <span className={`badge-plantilla ${plantilla.origen === "sistema" ? "sistema" : "nueva"}`}>
                {plantilla.origen === "sistema" ? "Del sistema" : "Nueva"}
              </span>
            </div>

            <div className="marco-preview">
              <VistaPreviaPlantilla id={plantilla.id} />
            </div>

            <div className="pie-plantilla">
              <div className="campos-esperados">
                {plantilla.camposEsperados.map((c) => (
                  <span key={c.etiqueta}>{c.etiqueta}</span>
                ))}
              </div>
            </div>
            <p className="descripcion-plantilla">{plantilla.descripcionUso}</p>
          </div>
        ))}
      </div>

      {seleccionada ? (
        <DrawerPlantilla plantilla={seleccionada} onCerrar={() => setSeleccionada(null)} />
      ) : null}
    </>
  );
}

function DrawerPlantilla({ plantilla, onCerrar }: { plantilla: PlantillaVisual; onCerrar: () => void }) {
  return (
    <>
      <div className="fondo-drawer" onClick={onCerrar} />
      <div className="drawer">
        <div className="drawer-cierre">
          <button onClick={onCerrar} type="button">✕</button>
        </div>

        <div className="drawer-titulo">
          <b>{plantilla.nombre}</b>
        </div>
        <p className="drawer-desc">{plantilla.descripcionUso}</p>

        <div className="drawer-seccion">
          <div className="etiqueta">Campos que espera</div>
          <div className="lista-campos-plantilla">
            {plantilla.camposEsperados.map((c) => (
              <div className="fila-campo-plantilla" key={c.etiqueta}>
                <div className="info-campo-p">
                  <b>{c.etiqueta}</b>
                  <span>{c.obligatorio ? "Obligatorio" : "Opcional"}</span>
                </div>
                <span className="tipo-campo-pill-p">{NOMBRE_TIPO_CAMPO[c.tipo]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="drawer-seccion">
          <div className="etiqueta">Vista previa</div>
          <div className="telefono">
            <div className="pantalla-tel">
              <VistaPreviaPlantilla id={plantilla.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function VistaPreviaPlantilla({ id }: { id: string }) {
  switch (id) {
    case "lista-simple":
      return (
        <>
          <div className="mr-fila">
            <div className="mr-icono">🧺</div>
            <div className="mr-txt"><b>Lavado y secado</b><span>Por kilo</span></div>
            <div className="mr-precio">S/8</div>
          </div>
          <div className="mr-fila">
            <div className="mr-icono">👔</div>
            <div className="mr-txt"><b>Planchado</b><span>Por prenda</span></div>
            <div className="mr-precio">S/2</div>
          </div>
          <div className="mr-fila">
            <div className="mr-icono">🛏️</div>
            <div className="mr-txt"><b>Edredón</b><span>Lavado especial</span></div>
            <div className="mr-precio">S/25</div>
          </div>
        </>
      );
    case "grilla-foto":
      return (
        <div className="mr-grid2">
          <div>
            <div className="mr-img" style={{ height: 44 }}><span className="mr-cinta">★</span></div>
            <b style={{ fontSize: 8 }}>Chompa alpaca</b>
            <div className="mr-precio" style={{ fontSize: 8 }}>S/120</div>
          </div>
          <div>
            <div className="mr-img" style={{ height: 44 }} />
            <b style={{ fontSize: 8 }}>Bufanda</b>
            <div className="mr-precio" style={{ fontSize: 8 }}>S/45</div>
          </div>
        </div>
      );
    case "lista-agrupada":
      return (
        <>
          <div className="mr-seccion">Entradas</div>
          <div className="mr-fila"><div className="mr-txt"><b>Anticuchos</b></div><div className="mr-precio">S/18</div></div>
          <div className="mr-seccion">Parrillas</div>
          <div className="mr-fila"><div className="mr-txt"><b>Parrilla familiar</b><span>★ Más pedido</span></div><div className="mr-precio">S/89</div></div>
        </>
      );
    case "chips":
      return (
        <div className="mr-chips">
          <span className="mr-chip">🎨 Pintura</span>
          <span className="mr-chip">⚡ Electricidad</span>
          <span className="mr-chip">🚿 Gasfitería</span>
          <span className="mr-chip">🔨 Herramientas</span>
          <span className="mr-chip">🔑 Cerrajería</span>
        </div>
      );
    case "carrusel-descuento":
      return (
        <div className="mr-fila-carrusel">
          <div className="mr-item-carrusel">
            <div className="mr-img"><span className="mr-cinta">-20%</span></div>
            <b style={{ fontSize: 7.5 }}>Parrilla</b>
            <div style={{ fontSize: 7.5 }}><span className="mr-tachado">S/89</span>S/71</div>
          </div>
          <div className="mr-item-carrusel">
            <div className="mr-img"><span className="mr-cinta">2x1</span></div>
            <b style={{ fontSize: 7.5 }}>Cervezas</b>
            <div style={{ fontSize: 7.5 }}>S/25</div>
          </div>
        </div>
      );
    case "ficha-perfil":
      return (
        <div className="mr-tarjeta-blanca" style={{ textAlign: "center" }}>
          <div className="mr-avatar" style={{ margin: "0 auto 5px" }} />
          <b style={{ fontSize: 9 }}>Dra. Rocío Salas</b>
          <div style={{ fontSize: 7.5, color: "var(--texto-tenue)" }}>Psicóloga clínica</div>
          <div className="mr-precio" style={{ marginTop: 3 }}>S/80 / sesión</div>
        </div>
      );
    case "galeria-descripcion":
      return (
        <div className="mr-tarjeta-blanca">
          <div className="mr-img" style={{ height: 44 }} />
          <b style={{ fontSize: 8.5 }}>Depa 2 dorm. — San Borja</b>
          <div style={{ fontSize: 7, color: "var(--texto-tenue)" }}>Cerca al parque, 65m², amoblado</div>
          <div className="mr-precio" style={{ marginTop: 2 }}>S/1,800 / mes</div>
        </div>
      );
    case "tabla-planes":
      return (
        <div className="mr-tabla-planes">
          <div className="mr-plan"><b>Básico</b><span className="mr-precio-plan">S/30</span></div>
          <div className="mr-plan destacado"><b>Pro</b><span className="mr-precio-plan">S/60</span></div>
          <div className="mr-plan"><b>Premium</b><span className="mr-precio-plan">S/90</span></div>
        </div>
      );
    case "franjas-horarias":
      return (
        <>
          <b style={{ fontSize: 8.5, display: "block", marginBottom: 5 }}>Cancha de fulbito — Hoy</b>
          <div className="mr-franjas">
            <span className="mr-franja ocupada">6pm</span>
            <span className="mr-franja libre">7pm</span>
            <span className="mr-franja libre">8pm</span>
            <span className="mr-franja ocupada">9pm</span>
          </div>
        </>
      );
    case "ficha-mapa":
      return (
        <div className="mr-tarjeta-blanca">
          <div className="mr-mapa">📍</div>
          <b style={{ fontSize: 8.5 }}>Casa 3 dorm. — Los Rosales</b>
          <div className="mr-specs" style={{ marginTop: 2 }}>🛏️ 3 · 🚿 2 · 📐 120m²</div>
          <div className="mr-precio" style={{ marginTop: 2 }}>S/320,000</div>
        </div>
      );
    case "pizarra-precios":
      return (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 700 }}>Corte + barba</div>
          <span className="mr-precio-pizarra">S/25</span>
        </div>
      );
    case "tarjeta-calificacion":
      return (
        <div className="mr-tarjeta-blanca" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="mr-avatar" style={{ width: 28, height: 28, borderRadius: 8 }} />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 8.5, display: "block" }}>Tour a las huacas</b>
            <span className="mr-estrellas">★★★★☆</span>
          </div>
          <div className="mr-precio">S/45</div>
        </div>
      );
    case "grid-iconos":
      return (
        <div className="mr-grid2">
          <div className="mr-tarjeta-blanca" style={{ textAlign: "center", padding: "8px 4px" }}>
            <div style={{ fontSize: 14 }}>🎨</div>
            <b style={{ fontSize: 7.5 }}>Arte</b>
          </div>
          <div className="mr-tarjeta-blanca" style={{ textAlign: "center", padding: "8px 4px" }}>
            <div style={{ fontSize: 14 }}>📚</div>
            <b style={{ fontSize: 7.5 }}>Libros</b>
          </div>
        </div>
      );
    case "info-reserva":
      return (
        <div className="mr-tarjeta-blanca">
          <div style={{ fontSize: 8, marginBottom: 3 }}>📍 A 2 cuadras del parque</div>
          <div style={{ fontSize: 8, marginBottom: 3 }}>🕒 Lun–Sáb, 9am–6pm</div>
          <div className="mr-cta">Reservar por WhatsApp</div>
        </div>
      );
    case "ficha-datos":
      return (
        <div className="mr-tarjeta-blanca">
          <div className="mr-fila"><div className="mr-txt"><b>Capacidad</b></div><span style={{ fontSize: 8 }}>150 personas</span></div>
          <div className="mr-fila"><div className="mr-txt"><b>Estacionamiento</b></div><span style={{ fontSize: 8 }}>Sí</span></div>
          <div className="mr-fila"><div className="mr-txt"><b>Precio/hora</b></div><span style={{ fontSize: 8 }}>S/250</span></div>
        </div>
      );
    default:
      return null;
  }
}
