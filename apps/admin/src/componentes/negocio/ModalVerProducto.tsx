import { AtributoProductoDef, Moneda, Producto, SIMBOLO_MONEDA } from "@app-vecinos/tipos";
import { urlCompleta } from "../../utilidades/media";
import { PALETA_COLORES } from "./SelectorColorAtributo";

function etiquetaAtributo(def: AtributoProductoDef, valor: string): string {
  if (def.tipo === "color") return PALETA_COLORES.find((c) => c.clave === valor)?.nombre ?? valor;
  return valor;
}

/** Vista previa de solo lectura — el "Ver" del CRUD, sin campos editables. */
export function ModalVerProducto({
  producto,
  moneda,
  atributosDef,
  onCerrar,
  onEditar,
}: {
  producto: Producto;
  moneda: Moneda;
  atributosDef: AtributoProductoDef[];
  onCerrar: () => void;
  onEditar: () => void;
}) {
  const atributosConValor = atributosDef.filter((def) => producto.atributos?.[def.clave]);

  return (
    <div className="overlay-modal" onClick={onCerrar}>
      <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <h3>{producto.nombre}</h3>
        {producto.destacado ? <span className="pill pill-oro">Más pedido</span> : null}

        <div
          style={{
            width: "100%",
            maxHeight: 320,
            borderRadius: 10,
            margin: "12px 0",
            overflow: "hidden",
            background: "var(--superficie-hundida)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          {producto.fotoUrl ? (
            // "contain", no "cover": acá se quiere ver la foto completa, no recortada a un
            // recuadro — a diferencia de la miniatura de la fila, que sí puede recortar.
            <img
              src={urlCompleta(producto.fotoUrl)}
              alt=""
              style={{ width: "100%", maxHeight: 320, objectFit: "contain", display: "block" }}
            />
          ) : (
            <div style={{ aspectRatio: "1.6", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>🖼️</div>
          )}
        </div>

        <p style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
          {SIMBOLO_MONEDA[moneda]} {producto.precio.toFixed(2)}
        </p>

        {producto.descripcion ? (
          <p style={{ fontSize: 12.5, color: "var(--texto-suave)", margin: "0 0 12px" }}>{producto.descripcion}</p>
        ) : null}

        {atributosConValor.length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {atributosConValor.map((def) => (
              <span key={def.clave} className="pill" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {def.tipo === "color" ? (
                  <span
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: "50%",
                      background: PALETA_COLORES.find((c) => c.clave === producto.atributos![def.clave])?.muestra,
                      border: "1px solid rgba(0,0,0,.15)",
                    }}
                  />
                ) : null}
                {def.etiqueta}: {etiquetaAtributo(def, producto.atributos![def.clave])}
              </span>
            ))}
          </div>
        ) : null}

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCerrar}>
            Cerrar
          </button>
          <button className="btn-crear" onClick={onEditar}>
            ✏️ Editar
          </button>
        </div>
      </div>
    </div>
  );
}
