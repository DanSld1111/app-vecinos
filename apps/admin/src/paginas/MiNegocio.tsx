import { useState } from "react";
import { Negocio } from "@app-vecinos/tipos";
import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { useNegocios } from "../estado/useNegocios";
import { useCategorias } from "../estado/useCategorias";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { IconoCategoria } from "../componentes/IconoCategoria";
import { entorno } from "../config/entorno";

export function MiNegocio() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;
  return <FormularioInfo key={activo.id} negocio={activo} />;
}

function FormularioInfo({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const actualizarInfo = useNegocios((estado) => estado.actualizarInfo);
  const categorias = useCategorias((estado) => estado.categorias);

  const [nombre, setNombre] = useState(negocio.nombre);
  const [descripcion, setDescripcion] = useState(negocio.descripcion);
  const [categoriaId, setCategoriaId] = useState(negocio.categoriaIds[0] ?? "");
  const [direccion, setDireccion] = useState(negocio.direccion);
  const [telefono, setTelefono] = useState(negocio.telefono ?? "");
  const [whatsapp, setWhatsapp] = useState(negocio.whatsapp ?? "");
  const [guardado, setGuardado] = useState(false);

  const categoria = categorias.find((c) => c.id === categoriaId);

  async function guardar() {
    const ok = await actualizarInfo(
      negocio.id,
      {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoriaIds: categoriaId ? [categoriaId] : [],
        direccion: direccion.trim(),
        telefono: telefono.trim() || null,
        whatsapp: whatsapp.trim() || null,
      },
      token,
    );
    if (ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Mi negocio</h2>
          <p>{negocio.nombre} · San Borja</p>
        </div>
        <button className="btn btn-primario" onClick={guardar}>
          {guardado ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>

      <TabsMiNegocio />

      <div className="layout-editor">
        <div className="tarjeta">
          <div className="nota-info">
            ℹ️ Los cambios en nombre, dirección o categoría vuelven a pasar por validación antes de
            publicarse. Descripción, teléfono y WhatsApp se guardan directo.
          </div>

          <div className="campo-modal">
            <label>Nombre del negocio</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="campo-modal">
            <label>Descripción</label>
            <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="campo-modal">
            <label>Categoría</label>
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="campo-modal">
            <label>Dirección</label>
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div className="fila-2-campos">
            <div className="campo-modal">
              <label>Teléfono</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="campo-modal" style={{ marginBottom: 0 }}>
              <label>WhatsApp</label>
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="panel-referencia">
          <h3>Así te ven los vecinos</h3>
          <p className="sub-ref">Vista previa de tu ficha pública, tal cual aparece en la app.</p>
          <div className="etiqueta-pantalla">Ficha del negocio</div>
          <div className="telefono">
            <div className="pantalla-tel">
              <div className="mini-ficha-foto">
                {negocio.fotoPrincipalUrl ? (
                  <img src={`${entorno.origenApi}${negocio.fotoPrincipalUrl}`} alt="" />
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
    </>
  );
}
