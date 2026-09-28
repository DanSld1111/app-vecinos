import { useEffect, useRef, useState } from "react";
import { EstadoServicioApp, ServicioApp } from "@app-vecinos/tipos";
import { useServiciosApp } from "../estado/useServiciosApp";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { urlCompleta } from "../utilidades/media";

import { IconoEmoji } from "../componentes/IconoEmoji";
// A qué pantalla real navega cada servicio sigue fijo en el código de apps/movil — activar acá
// uno de los que todavía no tiene pantalla propia (Taxi, Turismo, etc.) cambia cómo se ve la
// tarjeta, pero tocarla en la app no lleva a ningún lado hasta que esa pantalla se construya.
// Ver docs/decisiones/0025-servicios-editables-desde-admin.md.
const SLUGS_CON_PANTALLA = new Set(["negocios", "restaurantes", "market-space", "supermarket"]);

export function Servicios() {
  const servicios = useServiciosApp((estado) => estado.servicios);
  const cargando = useServiciosApp((estado) => estado.cargando);
  const error = useServiciosApp((estado) => estado.error);
  const cargar = useServiciosApp((estado) => estado.cargar);
  const token = useSesionAdmin((estado) => estado.token)!;

  const [editandoSlug, setEditandoSlug] = useState<string | null>(null);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const editando = servicios.find((s) => s.slug === editandoSlug) ?? null;
  const disponibles = servicios.filter((s) => s.estado === "disponible").length;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Servicios</h2>
          <p>
            {servicios.length} tarjetas de la pantalla Servicios · {disponibles} disponible
            {disponibles === 1 ? "" : "s"} ahora
          </p>
        </div>
      </div>

      {error ? (
        <div className="panel" style={{ padding: 16, marginBottom: 16, background: "var(--rojo-suave)", color: "var(--rojo)" }}>
          <IconoEmoji e="⚠️" /> {error}
        </div>
      ) : null}

      {cargando && servicios.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--texto-tenue)" }}>
          Cargando…
        </div>
      ) : (
        <>
          {/* Como en la pestaña Servicios de la app: los disponibles son fotos grandes con el
              nombre encima; los que vienen después, una lista simple. */}
          <h3 className="titulo-seccion-servicios">Disponibles en la app</h3>
          <div className="grid-servicios-foto">
            {servicios
              .filter((s) => s.estado === "disponible")
              .map((servicio) => (
                <div className="tarjeta-servicio-foto" key={servicio.slug}>
                  <button
                    type="button"
                    className="portada-servicio"
                    onClick={() => setEditandoSlug(servicio.slug)}
                    aria-label={`Editar ${servicio.nombre}`}
                  >
                    {servicio.fotoUrl ? (
                      <img src={urlCompleta(servicio.fotoUrl)} alt="" />
                    ) : (
                      <span className="sin-foto-servicio">
                        <IconoEmoji e="🖼️" /> Sin foto
                      </span>
                    )}
                    <span className="texto-portada-servicio">
                      <b>{servicio.nombre}</b>
                      <span>{servicio.descripcion || "Sin descripción"}</span>
                    </span>
                  </button>
                  <div className="pie-servicio-foto">
                    <span className="negocios-servicio">
                      {servicio.negocios} negocio{servicio.negocios === 1 ? "" : "s"}
                    </span>
                    <button className="btn-accion-mini" onClick={() => setEditandoSlug(servicio.slug)}>
                      Editar
                    </button>
                  </div>
                  {!SLUGS_CON_PANTALLA.has(servicio.slug) ? (
                    <p className="aviso-sin-pantalla">Todavía no existe la pantalla: tocar la tarjeta no navega a ningún lado.</p>
                  ) : null}
                </div>
              ))}
          </div>

          <h3 className="titulo-seccion-servicios">Próximamente</h3>
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {servicios
                  .filter((s) => s.estado !== "disponible")
                  .map((servicio) => (
                    <tr key={servicio.slug}>
                      <td>
                        <b>{servicio.nombre}</b>
                      </td>
                      <td style={{ color: "var(--texto-suave)" }}>{servicio.descripcion || "Sin descripción"}</td>
                      <td>
                        <span className="pill pill-gris">Próximamente</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn-accion-mini" style={{ marginLeft: "auto" }} onClick={() => setEditandoSlug(servicio.slug)}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editando ? (
        <ModalServicio
          servicio={editando}
          token={token}
          puedeNavegar={SLUGS_CON_PANTALLA.has(editando.slug)}
          onCerrar={() => setEditandoSlug(null)}
        />
      ) : null}
    </>
  );
}

function ModalServicio({
  servicio,
  token,
  puedeNavegar,
  onCerrar,
}: {
  servicio: ServicioApp;
  token: string;
  puedeNavegar: boolean;
  onCerrar: () => void;
}) {
  const actualizar = useServiciosApp((estado) => estado.actualizar);
  const subirFoto = useServiciosApp((estado) => estado.subirFoto);
  const inputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(servicio.nombre);
  const [descripcion, setDescripcion] = useState(servicio.descripcion);
  const [estado, setEstado] = useState<EstadoServicioApp>(servicio.estado);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const huboCambio = nombre !== servicio.nombre || descripcion !== servicio.descripcion || estado !== servicio.estado;

  async function guardar() {
    setGuardando(true);
    const ok = await actualizar(servicio.slug, { nombre: nombre.trim(), descripcion: descripcion.trim(), estado }, token);
    setGuardando(false);
    if (ok) onCerrar();
  }

  async function alElegirFoto(archivo: File) {
    setSubiendoFoto(true);
    await subirFoto(servicio.slug, archivo, token);
    setSubiendoFoto(false);
  }

  return (
    <div className="overlay-modal" onClick={onCerrar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Editar "{servicio.nombre}"</h3>
        <p className="sub">
          Slug fijo: <code>{servicio.slug}</code> — no editable, está enlazado al código de la app.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = "";
            if (archivo) alElegirFoto(archivo);
          }}
        />
        <div className="campo-modal">
          <label>Foto de fondo de la tarjeta</label>
          <div className="selector-imagen">
            <div className="slot-imagen">
              {servicio.fotoUrl ? <img src={urlCompleta(servicio.fotoUrl)} alt="" /> : <IconoEmoji e="🖼️" />}
            </div>
            <div>
              <p>Solo se usa mientras el servicio está "Disponible" — en "Próximamente" no se muestra.</p>
              <button type="button" disabled={subiendoFoto} onClick={() => inputRef.current?.click()}>
                {subiendoFoto ? "Subiendo…" : servicio.fotoUrl ? "Cambiar foto" : "Subir foto"}
              </button>
            </div>
          </div>
        </div>

        <div className="campo-modal">
          <label>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="campo-modal">
          <label>Descripción corta</label>
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Platos y pedidos" />
        </div>

        <div className="campo-modal">
          <label>Estado</label>
          <div className="opciones-ubicacion">
            <label className={`opcion-ubicacion ${estado === "disponible" ? "marcada" : ""}`}>
              <input type="radio" checked={estado === "disponible"} onChange={() => setEstado("disponible")} />
              <div>
                <b>Disponible</b>
                <span>Aparece arriba, con foto de fondo, y se puede tocar.</span>
              </div>
            </label>
            <label className={`opcion-ubicacion ${estado === "proximamente" ? "marcada" : ""}`}>
              <input type="radio" checked={estado === "proximamente"} onChange={() => setEstado("proximamente")} />
              <div>
                <b>Próximamente</b>
                <span>Aparece abajo, en la lista de lo que viene, sin foto.</span>
              </div>
            </label>
          </div>
          {estado === "disponible" && !puedeNavegar ? (
            <p className="ayuda-modal" style={{ color: "var(--rojo)" }}>
              Todavía no existe la pantalla de "{servicio.nombre}" en la app — se mostrará disponible, pero
              tocar la tarjeta no navegará a ningún lado hasta que se construya.
            </p>
          ) : null}
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCerrar}>
            Cerrar
          </button>
          <button className="btn-crear" disabled={!huboCambio || guardando} onClick={guardar}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
