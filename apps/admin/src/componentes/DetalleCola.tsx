import { Link } from "react-router-dom";
import { Aviso, Negocio } from "@app-vecinos/tipos";
import { useCategorias } from "../estado/useCategorias";
import { urlCompleta } from "../utilidades/media";
import { listaSemanaCompleta } from "../utilidades/horarios";
import { partesDeFicha } from "../utilidades/completitudNegocio";
import { ESTILO_CATEGORIA } from "../paginas/Avisos";
import { IconoEmoji } from "./IconoEmoji";

/** Una fila "campo · valor" del detalle; si el valor falta se marca, para que el validador lo vea. */
function Campo({ nombre, valor }: { nombre: string; valor: string | null | undefined }) {
  return (
    <tr>
      <td className="campo-cola">{nombre}</td>
      <td>{valor && valor.trim() ? valor : <span className="falta-cola">Sin completar</span>}</td>
    </tr>
  );
}

/**
 * Lo que envió un negocio, ordenado como lo va a revisar el validador: foto, datos de contacto,
 * horario y lo que le falta a la ficha. La API no guarda la versión anterior de una edición, así
 * que se muestra el contenido actual completo (no un "antes y después").
 */
export function DetalleNegocioCola({ negocio }: { negocio: Negocio }) {
  const categorias = useCategorias((e) => e.categorias);
  const nombresCategorias = negocio.categoriaIds
    .map((id) => categorias.find((c) => c.id === id)?.nombre)
    .filter(Boolean)
    .join(", ");
  const diasAbiertos = listaSemanaCompleta(negocio.horarios)
    .filter((d) => d.texto !== "Cerrado")
    .map((d) => `${d.nombre.slice(0, 3)} ${d.texto}`);
  const faltantes = partesDeFicha(negocio, true).filter((p) => !p.completa && p.clave !== "dueno");
  const foto = urlCompleta(negocio.fotoPrincipalUrl);

  return (
    <div className="detalle-cola">
      <div className="detalle-cola-cab">
        {foto ? (
          <img className="detalle-cola-foto" src={foto} alt={`Foto de ${negocio.nombre}`} />
        ) : (
          <div className="detalle-cola-foto sin-foto">
            <IconoEmoji e="🖼️" />
            <span>Sin foto</span>
          </div>
        )}
        <div>
          <div className="detalle-cola-rubro">{nombresCategorias || "Sin categoría"}</div>
          <p className="detalle-cola-desc">{negocio.descripcion || "Sin descripción."}</p>
          <Link className="ver-todo" to={`/negocios/${negocio.id}`}>
            Abrir la ficha completa →
          </Link>
        </div>
      </div>

      <table className="tabla-cola">
        <tbody>
          <Campo nombre="Dirección" valor={negocio.direccion} />
          <Campo nombre="Teléfono" valor={negocio.telefono} />
          <Campo nombre="WhatsApp" valor={negocio.whatsapp} />
          <Campo nombre="Horario" valor={diasAbiertos.join(" · ")} />
        </tbody>
      </table>

      {faltantes.length > 0 ? (
        <div className="nota-alerta">
          <IconoEmoji e="⚠️" /> A la ficha le falta: {faltantes.map((p) => p.etiqueta).join(", ")}.
        </div>
      ) : (
        <div className="nota-info">
          <IconoEmoji e="✅" /> Foto, horario, descripción y categoría completos.
        </div>
      )}
    </div>
  );
}

/** Un aviso pendiente: sus datos y, al lado, cómo lo van a ver los vecinos en Comunidad. */
export function DetalleAvisoCola({ aviso }: { aviso: Aviso }) {
  const estilo = ESTILO_CATEGORIA[aviso.categoria];
  return (
    <div className="detalle-cola detalle-cola-aviso">
      <table className="tabla-cola">
        <tbody>
          <Campo nombre="Categoría" valor={estilo.etiqueta} />
          <Campo nombre="Fuente" valor={aviso.fuenteNombre} />
          <Campo nombre="Verificada" valor={aviso.fuenteVerificada ? "Sí, muestra la insignia" : "No"} />
          <Campo nombre="Título" valor={aviso.titulo} />
          <Campo nombre="Texto" valor={aviso.cuerpo} />
        </tbody>
      </table>
      <div className="telefono telefono-cola">
        <div className="pantalla-tel">
          <div className="mini-titulo-seccion">Comunidad</div>
          <div className="mini-tarjeta-aviso">
            <div className="mini-cab-aviso">
              <div className="mini-avatar-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                <IconoEmoji e={estilo.icono} />
              </div>
              <div className="mini-info-fuente">
                <div className="mini-fila-fuente">
                  <span className="mini-fuente-aviso">{aviso.fuenteNombre}</span>
                  {aviso.fuenteVerificada ? (
                    <span className="mini-tick-aviso">
                      <IconoEmoji e="✓" />
                    </span>
                  ) : null}
                </div>
                <span className="mini-fecha-aviso">Al aprobarlo</span>
              </div>
              <span className="mini-pill-aviso" style={{ background: estilo.fondoVar, color: estilo.textoVar }}>
                {estilo.etiqueta}
              </span>
            </div>
            <div className="mini-cuerpo-aviso-cont">
              <span className="mini-titulo-aviso">{aviso.titulo}</span>
              <span className="mini-cuerpo-aviso">{aviso.cuerpo}</span>
            </div>
            <div className="mini-pie-aviso">
              <span className="mini-accion-aviso">
                <IconoEmoji e="🤍" /> 0
              </span>
              <span className="mini-accion-aviso">
                <IconoEmoji e="📤" /> 0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
