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
  const faltantes = partesDeFicha(negocio, true, categorias).filter((p) => !p.completa && p.clave !== "dueno");
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

/**
 * Antes y después de un aviso que se reenvió tras un rechazo: la versión rechazada (con su
 * motivo) al lado de la corregida, con los campos que cambiaron resaltados. El servidor guarda la
 * versión rechazada al reenviar (columna avisos.version_rechazada, ver decisión 0079).
 */
function AntesDespuesAviso({ aviso }: { aviso: Aviso }) {
  const antes = aviso.versionRechazada!;
  const filas: { nombre: string; antes: string; ahora: string }[] = [
    { nombre: "Categoría", antes: ESTILO_CATEGORIA[antes.categoria].etiqueta, ahora: ESTILO_CATEGORIA[aviso.categoria].etiqueta },
    { nombre: "Título", antes: antes.titulo, ahora: aviso.titulo },
    { nombre: "Texto", antes: antes.cuerpo, ahora: aviso.cuerpo },
  ];
  const cambios = filas.filter((f) => f.antes.trim() !== f.ahora.trim()).length;
  return (
    <div className="antes-despues">
      <div className="nota-alerta">
        <IconoEmoji e="↩️" /> Reenviado tras un rechazo
        {antes.motivoRechazo ? (
          <>
            . Motivo: <b>“{antes.motivoRechazo}”</b>
          </>
        ) : null}
      </div>
      <table className="tabla-cola tabla-antes-despues">
        <thead>
          <tr>
            <th></th>
            <th>Rechazado</th>
            <th>Reenviado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const cambio = f.antes.trim() !== f.ahora.trim();
            return (
              <tr key={f.nombre} className={cambio ? "cambio" : undefined}>
                <td className="campo-cola">{f.nombre}</td>
                <td className="valor-antes">{f.antes}</td>
                <td className="valor-ahora">
                  {f.ahora}
                  {cambio ? <span className="marca-cambio">Cambió</span> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="resumen-cambios">
        {cambios === 0
          ? "Se reenvió sin cambios respecto a la versión rechazada."
          : `${cambios} ${cambios === 1 ? "campo cambió" : "campos cambiaron"} respecto a la versión rechazada.`}
      </p>
    </div>
  );
}

/** Un aviso pendiente: sus datos (o el antes y después si fue reenviado) y cómo lo verán los vecinos. */
export function DetalleAvisoCola({ aviso }: { aviso: Aviso }) {
  const estilo = ESTILO_CATEGORIA[aviso.categoria];
  return (
    <div className="detalle-cola detalle-cola-aviso">
      {aviso.versionRechazada ? (
        <AntesDespuesAviso aviso={aviso} />
      ) : (
        <table className="tabla-cola">
          <tbody>
            <Campo nombre="Categoría" valor={estilo.etiqueta} />
            <Campo nombre="Fuente" valor={aviso.fuenteNombre} />
            <Campo nombre="Verificada" valor={aviso.fuenteVerificada ? "Sí, muestra la insignia" : "No"} />
            <Campo nombre="Título" valor={aviso.titulo} />
            <Campo nombre="Texto" valor={aviso.cuerpo} />
          </tbody>
        </table>
      )}
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
