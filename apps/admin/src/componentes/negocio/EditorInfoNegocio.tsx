import { useEffect, useState } from "react";
import { Coordenada, Moneda, NOMBRE_MONEDA, Negocio, SIMBOLO_MONEDA } from "@app-vecinos/tipos";
import { useNegocios } from "../../estado/useNegocios";
import { useCategorias } from "../../estado/useCategorias";
import { useServiciosApp } from "../../estado/useServiciosApp";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { IconoCategoria } from "../IconoCategoria";
import { SelectorServicioYCategoria } from "./SelectorServicioYCategoria";
import { CampoDireccionConMapa } from "./CampoDireccionConMapa";
import { urlCompleta } from "../../utilidades/media";
import { soloDigitos } from "../../utilidades/telefono";
import { useToasts } from "../../estado/useToasts";

const MONEDAS: Moneda[] = ["PEN", "USD", "EUR"];

/**
 * Datos básicos de la ficha. Compartido entre "Mi negocio" (el dueño edita el suyo) y la ficha
 * del panel (el admin edita cualquiera) — la única diferencia entre ambos contextos es el
 * encabezado y las pestañas, que pone cada página; el formulario es el mismo.
 */
export function EditorInfoNegocio({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const actualizarInfo = useNegocios((estado) => estado.actualizarInfo);
  const categorias = useCategorias((estado) => estado.categorias);
  const servicios = useServiciosApp((estado) => estado.servicios);
  const cargarServicios = useServiciosApp((estado) => estado.cargar);
  const avisos = useToasts((estado) => estado.mostrar);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const [nombre, setNombre] = useState(negocio.nombre);
  const [descripcion, setDescripcion] = useState(negocio.descripcion);
  const [categoriaId, setCategoriaId] = useState(negocio.categoriaIds[0] ?? "");
  const [direccion, setDireccion] = useState(negocio.direccion);
  const [telefono, setTelefono] = useState(negocio.telefono ?? "");
  const [whatsapp, setWhatsapp] = useState(negocio.whatsapp ?? "");
  const [moneda, setMoneda] = useState<Moneda>(negocio.moneda);
  const [coordenada, setCoordenada] = useState<Coordenada>(negocio.coordenada);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const categoria = categorias.find((c) => c.id === categoriaId);

  async function guardar() {
    setGuardando(true);
    const ok = await actualizarInfo(
      negocio.id,
      {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoriaIds: categoriaId ? [categoriaId] : [],
        direccion: direccion.trim(),
        telefono: telefono.trim() || null,
        whatsapp: whatsapp.trim() || null,
        moneda,
        coordenada,
      },
      token,
    );
    setGuardando(false);
    if (ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
      avisos("Información guardada con éxito");
    } else {
      avisos("No se pudo guardar. Intenta de nuevo.", "error");
    }
  }

  return (
    <div className="layout-editor">
      <div className="tarjeta">
        <div className="nota-info">ℹ️ Los cambios se guardan directo y se ven en la app de inmediato.</div>

        <div className="campo-modal">
          <label>Nombre del negocio</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="campo-modal">
          <label>Descripción</label>
          <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div className="campo-modal">
          <SelectorServicioYCategoria
            servicios={servicios}
            categorias={categorias}
            categoriaId={categoriaId}
            onCambiarCategoria={setCategoriaId}
          />
        </div>
        <div className="fila-2-campos">
          <div className="campo-modal">
            <label>Teléfono</label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(soloDigitos(e.target.value))}
              inputMode="numeric"
              maxLength={9}
              placeholder="9 dígitos"
            />
          </div>
          <div className="campo-modal">
            <label>WhatsApp</label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(soloDigitos(e.target.value))}
              inputMode="numeric"
              maxLength={9}
              placeholder="9 dígitos"
            />
          </div>
        </div>

        <div className="campo-modal">
          <label>Moneda</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MONEDAS.map((m) => (
              <button
                key={m}
                type="button"
                className={`chip-filtro ${moneda === m ? "activo" : ""}`}
                onClick={() => setMoneda(m)}
              >
                {SIMBOLO_MONEDA[m]} {NOMBRE_MONEDA[m]}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--texto-suave)", margin: "6px 0 0" }}>
            Aplica a los productos, ofertas y servicios de este negocio.
          </p>
        </div>

        <CampoDireccionConMapa
          direccion={direccion}
          coordenada={coordenada}
          onCambiarDireccion={setDireccion}
          onCambiarCoordenada={setCoordenada}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button className="btn btn-primario" disabled={guardando} onClick={guardar}>
            {guardando ? "Guardando…" : guardado ? "✓ Guardado" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="panel-referencia">
        <h3>Así te ven los vecinos</h3>
        <p className="sub-ref">Vista previa de la ficha pública, tal cual aparece en la app.</p>
        <div className="etiqueta-pantalla">Ficha del negocio</div>
        <div className="telefono">
          <div className="pantalla-tel">
            <div className="mini-ficha-foto">
              {negocio.fotoPrincipalUrl ? (
                <img src={urlCompleta(negocio.fotoPrincipalUrl)} alt="" />
              ) : (
                <IconoCategoria nombre={categoria?.icono ?? "storefront-outline"} size={22} />
              )}
            </div>
            <div className="mini-ficha-nombre">{nombre || "Nombre del negocio"}</div>
            <div className="mini-ficha-desc">{descripcion || "Sin descripción todavía."}</div>
            <div className="mini-ficha-botones">
              <span className="whatsapp">💬 WhatsApp</span>
              <span className="llamar">📞 Llamar</span>
            </div>
            <div className="mini-ficha-pie">
              {negocio.verificadoEn ? `Datos verificados el ${negocio.verificadoEn}` : "Aún no verificado"}
            </div>
          </div>
        </div>
        <p className="nota-mini">
          Si el teléfono o WhatsApp quedan vacíos, ese botón simplemente no hace nada — no se oculta.
        </p>
      </div>
    </div>
  );
}
