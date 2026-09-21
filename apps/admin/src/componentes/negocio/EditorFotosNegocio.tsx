import { useRef, useState } from "react";
import { Negocio } from "@app-vecinos/tipos";
import { useNegocios } from "../../estado/useNegocios";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { urlCompleta } from "../../utilidades/media";

const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp";
const MAX_FOTOS_GALERIA = 6;

/**
 * Foto principal + galería. Las fotos de cada producto ya no viven acá: se manejan dentro de la
 * pestaña Productos, junto al resto de los datos de ese producto.
 *
 * Compartido entre "Mi negocio" (dueño) y la ficha del panel (admin).
 */
export function EditorFotosNegocio({ negocio }: { negocio: Negocio }) {
  const token = useSesionAdmin((estado) => estado.token)!;
  const subirFoto = useNegocios((estado) => estado.subirFoto);
  const error = useNegocios((estado) => estado.error);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function alElegirArchivo(archivo: File) {
    setSubiendo(true);
    await subirFoto(negocio.id, archivo, token);
    setSubiendo(false);
  }

  return (
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

            {negocio.fotoPrincipalUrl ? (
              <div className="slot-foto-principal slot-foto-principal--con-foto">
                <img src={urlCompleta(negocio.fotoPrincipalUrl)} alt={`Foto de ${negocio.nombre}`} />
              </div>
            ) : (
              <div className="slot-foto-principal">
                <span className="icono-slot">🖼️</span>
                <button type="button" disabled={subiendo} onClick={() => inputRef.current?.click()}>
                  {subiendo ? "Subiendo…" : "Subir foto principal"}
                </button>
              </div>
            )}

            {negocio.fotoPrincipalUrl && (
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
            Mientras no subas ninguna foto, la ficha muestra un espacio neutro — nunca fotos inventadas del
            negocio. Formatos aceptados: JPG, PNG o WEBP, hasta 5MB.
          </p>
        </div>

        <EditorGaleria negocioId={negocio.id} token={token} fotos={negocio.fotosGaleria} />
      </div>

      <div className="panel-referencia">
        <h3>Así te ven los vecinos</h3>
        <p className="sub-ref">
          {negocio.fotoPrincipalUrl ? "La ficha con la foto subida." : "La ficha sin foto propia todavía."}
        </p>
        <div className="etiqueta-pantalla">Ficha del negocio</div>
        <div className="telefono">
          <div className="pantalla-tel">
            <div className="mini-ficha-foto">
              {negocio.fotoPrincipalUrl ? (
                <img src={urlCompleta(negocio.fotoPrincipalUrl)} alt="" />
              ) : (
                "🖼️"
              )}
            </div>
            <div className="mini-ficha-nombre">{negocio.nombre}</div>
            <div className="mini-ficha-desc">
              {negocio.fotoPrincipalUrl
                ? "Foto propia del negocio."
                : "Sin foto propia — se ve un espacio neutro, nunca una foto inventada."}
            </div>
          </div>
        </div>
        <p className="nota-mini">Nunca mostramos una foto que no se subió — es un espacio gris a propósito.</p>
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
        Solo se muestra en la ficha si no hay menú, catálogo ni servicios cargados — hasta {MAX_FOTOS_GALERIA}{" "}
        fotos (fachada, interior, lo que ofrece, etc.).
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
            <img src={urlCompleta(url)} alt="" />
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
          <button
            type="button"
            className="slot-galeria slot-galeria--agregar"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
          >
            {subiendo ? "Subiendo…" : "＋ Agregar"}
          </button>
        )}
      </div>
    </div>
  );
}
