import { useEffect, useRef, useState } from "react";
import { Producto } from "@app-vecinos/tipos";
import { useNegociosDelDueno } from "../estado/useNegocioActivo";
import { useNegocios } from "../estado/useNegocios";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { TabsMiNegocio } from "../componentes/TabsMiNegocio";
import { entorno } from "../config/entorno";
import { apiFetch } from "../datos/clienteApi";

const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp";
const MAX_FOTOS_GALERIA = 6;

export function MiNegocioFotos() {
  const { activo } = useNegociosDelDueno();
  if (!activo) return null;
  return (
    <EditorFotos
      key={activo.id}
      negocioId={activo.id}
      nombre={activo.nombre}
      fotoPrincipalUrl={activo.fotoPrincipalUrl}
      fotosGaleria={activo.fotosGaleria}
    />
  );
}

function EditorFotos({
  negocioId,
  nombre,
  fotoPrincipalUrl,
  fotosGaleria,
}: {
  negocioId: string;
  nombre: string;
  fotoPrincipalUrl: string | null;
  fotosGaleria: string[];
}) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const subirFoto = useNegocios((estado) => estado.subirFoto);
  const error = useNegocios((estado) => estado.error);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function alElegirArchivo(archivo: File) {
    setSubiendo(true);
    await subirFoto(negocioId, archivo, token);
    setSubiendo(false);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Fotos</h2>
          <p>{nombre} · San Borja</p>
        </div>
      </div>

      <TabsMiNegocio />

      <div className="layout-editor">
        <div>
          <div className="tarjeta">
            <div className="campo-modal">
              <label>Foto principal</label>

              <input
                ref={inputRef}
                type="file"
                accept={TIPOS_ACEPTADOS}
                style={{ display: "none" }}
                onChange={(e) => {
                  const archivo = e.target.files?.[0];
                  e.target.value = ""; // permite volver a elegir el mismo archivo si falla
                  if (archivo) alElegirArchivo(archivo);
                }}
              />

              {fotoPrincipalUrl ? (
                <div className="slot-foto-principal slot-foto-principal--con-foto">
                  <img src={`${entorno.origenApi}${fotoPrincipalUrl}`} alt={`Foto de ${nombre}`} />
                </div>
              ) : (
                <div className="slot-foto-principal">
                  <span className="icono-slot">🖼️</span>
                  <button type="button" disabled={subiendo} onClick={() => inputRef.current?.click()}>
                    {subiendo ? "Subiendo…" : "Subir foto principal"}
                  </button>
                </div>
              )}

              {fotoPrincipalUrl && (
                <button
                  type="button"
                  className="boton-secundario"
                  disabled={subiendo}
                  onClick={() => inputRef.current?.click()}
                >
                  {subiendo ? "Subiendo…" : "Cambiar foto"}
                </button>
              )}
            </div>

            {error && <p style={{ fontSize: 11.5, color: "var(--rojo)", margin: "8px 0 0" }}>{error}</p>}

            <p style={{ fontSize: 11.5, color: "var(--texto-suave)", lineHeight: 1.6, margin: "12px 0 0" }}>
              Mientras no subas ninguna foto, tu ficha muestra un espacio neutro — nunca fotos inventadas de tu
              negocio. Formatos aceptados: JPG, PNG o WEBP, hasta 5MB.
            </p>
          </div>

          <EditorProductos negocioId={negocioId} token={token} />
          <EditorGaleria negocioId={negocioId} token={token} fotos={fotosGaleria} />
        </div>

        <div className="panel-referencia">
          <h3>Así te ven los vecinos</h3>
          <p className="sub-ref">
            {fotoPrincipalUrl ? "Tu ficha con la foto que subiste." : "Tu ficha sin foto propia todavía."}
          </p>
          <div className="etiqueta-pantalla">Ficha del negocio</div>
          <div className="telefono">
            <div className="pantalla-tel">
              <div className="mini-ficha-foto">
                {fotoPrincipalUrl ? <img src={`${entorno.origenApi}${fotoPrincipalUrl}`} alt="" /> : "🖼️"}
              </div>
              <div className="mini-ficha-nombre">{nombre}</div>
              <div className="mini-ficha-desc">
                {fotoPrincipalUrl
                  ? "Foto propia del negocio."
                  : "Sin foto propia — se ve un espacio neutro, nunca una foto inventada."}
              </div>
            </div>
          </div>
          <p className="nota-mini">Nunca mostramos una foto que no subiste — es un espacio gris a propósito.</p>
        </div>
      </div>
    </>
  );
}

/**
 * Solo pone/cambia la foto de un producto que ya existe (menú o catálogo) — el alta y edición
 * del producto en sí todavía se hace por carga manual, no desde el panel. Ver
 * docs/decisiones/0028-fotos-productos-galeria-y-publicidad.md.
 */
function EditorProductos({ negocioId, token }: { negocioId: string; token: string }) {
  const subirFotoProducto = useNegocios((estado) => estado.subirFotoProducto);
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [subiendoId, setSubiendoId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    apiFetch<Producto[]>(`/negocios/${negocioId}/productos`)
      .then(setProductos)
      .catch(() => setProductos([]));
  }, [negocioId]);

  async function alElegirArchivo(producto: Producto, archivo: File) {
    setSubiendoId(producto.id);
    const actualizado = await subirFotoProducto(negocioId, producto.id, archivo, token);
    if (actualizado) {
      setProductos((actual) => actual?.map((p) => (p.id === producto.id ? actualizado : p)) ?? actual);
    }
    setSubiendoId(null);
  }

  if (productos === null) return null;
  if (productos.length === 0) return null;

  return (
    <div className="tarjeta" style={{ marginTop: 16 }}>
      <label style={{ display: "block", marginBottom: 10 }}>Fotos de tu menú / catálogo</label>
      <div className="lista-fotos-producto">
        {productos.map((producto) => (
          <div className="fila-producto-foto" key={producto.id}>
            <div className="foto-servicio">
              {producto.fotoUrl ? (
                <img src={`${entorno.origenApi}${producto.fotoUrl}`} alt="" />
              ) : (
                "🖼️"
              )}
            </div>
            <span className="nombre-producto-foto">{producto.nombre}</span>
            <input
              ref={(el) => {
                inputRefs.current[producto.id] = el;
              }}
              type="file"
              accept={TIPOS_ACEPTADOS}
              style={{ display: "none" }}
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                e.target.value = "";
                if (archivo) alElegirArchivo(producto, archivo);
              }}
            />
            <button
              type="button"
              className="btn-accion-mini"
              disabled={subiendoId === producto.id}
              onClick={() => inputRefs.current[producto.id]?.click()}
            >
              {subiendoId === producto.id ? "Subiendo…" : producto.fotoUrl ? "Cambiar" : "Subir foto"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorGaleria({ negocioId, token, fotos }: { negocioId: string; token: string; fotos: string[] }) {
  const agregarFotoGaleria = useNegocios((estado) => estado.agregarFotoGaleria);
  const eliminarFotoGaleria = useNegocios((estado) => estado.eliminarFotoGaleria);
  const [subiendo, setSubiendo] = useState(false);
  const [borrandoUrl, setBorrandoUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function alElegirArchivo(archivo: File) {
    setSubiendo(true);
    await agregarFotoGaleria(negocioId, archivo, token);
    setSubiendo(false);
  }

  async function alBorrar(url: string) {
    setBorrandoUrl(url);
    await eliminarFotoGaleria(negocioId, url, token);
    setBorrandoUrl(null);
  }

  return (
    <div className="tarjeta" style={{ marginTop: 16 }}>
      <label style={{ display: "block", marginBottom: 4 }}>Galería del negocio</label>
      <p style={{ fontSize: 11.5, color: "var(--texto-suave)", lineHeight: 1.6, margin: "0 0 10px" }}>
        Solo se muestra en tu ficha si no tienes menú, catálogo ni servicios cargados — hasta {MAX_FOTOS_GALERIA}{" "}
        fotos (fachada, interior, lo que ofreces, etc.).
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_ACEPTADOS}
        style={{ display: "none" }}
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          e.target.value = "";
          if (archivo) alElegirArchivo(archivo);
        }}
      />

      <div className="grid-galeria">
        {fotos.map((url) => (
          <div className="slot-galeria" key={url}>
            <img src={`${entorno.origenApi}${url}`} alt="" />
            <button
              type="button"
              className="btn-borrar-galeria"
              disabled={borrandoUrl === url}
              onClick={() => alBorrar(url)}
              title="Borrar esta foto"
            >
              🗑️
            </button>
          </div>
        ))}
        {fotos.length < MAX_FOTOS_GALERIA && (
          <button type="button" className="slot-galeria slot-galeria--agregar" disabled={subiendo} onClick={() => inputRef.current?.click()}>
            {subiendo ? "Subiendo…" : "＋ Agregar"}
          </button>
        )}
      </div>
    </div>
  );
}
