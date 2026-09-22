import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtributoProductoDef, Coordenada, Producto } from "@app-vecinos/tipos";
import { useNegocios } from "../estado/useNegocios";
import { useGeografia } from "../estado/useGeografia";
import { useCuentas } from "../estado/useCuentas";
import { useCategorias } from "../estado/useCategorias";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { useToasts } from "../estado/useToasts";
import { generarContrasenaTemporal } from "../utilidades/contrasena";
import { urlCompleta } from "../utilidades/media";
import { soloDigitos } from "../utilidades/telefono";
import { ModalContrasenaGenerada } from "../componentes/ModalContrasenaGenerada";
import { SelectorCategoria } from "../componentes/negocio/SelectorCategoria";
import { CampoDireccionConMapa } from "../componentes/negocio/CampoDireccionConMapa";
import { ModalProducto } from "../componentes/negocio/ModalProducto";
import { SelectorColorAtributo } from "../componentes/negocio/SelectorColorAtributo";
import * as productosApi from "../datos/productosApi";
import { DatosProducto } from "../datos/productosApi";

type Paso = 1 | 2 | 3 | 4;
const ETIQUETAS_PASO: Record<Paso, string> = {
  1: "Datos básicos",
  2: "Dueño",
  3: "Primer producto",
  4: "Listo",
};

const CENTRO_LIMA: Coordenada = { lat: -12.0851, lng: -77.0}; // San Borja, aprox — solo mientras no hay comunidad elegida.

/**
 * Alta de negocio en pantalla completa, por pasos — reemplaza al modal de "Alta rápida". El
 * negocio se crea de verdad al terminar el paso 1 (igual que antes: alta rápida, se completa
 * después); los pasos 2 y 3 ya operan sobre ese negocio recién creado y se pueden omitir.
 * Ver docs/decisiones/0071-plan-v2-modulo-negocios.md.
 */
export function RegistrarNegocio() {
  const navegar = useNavigate();
  const token = useSesionAdmin((estado) => estado.token)!;
  const distritos = useGeografia((estado) => estado.distritos);
  const comunidades = useGeografia((estado) => estado.comunidades);
  const categorias = useCategorias((estado) => estado.categorias);
  const crearNegocio = useNegocios((estado) => estado.crear);
  const actualizarInfo = useNegocios((estado) => estado.actualizarInfo);
  const avisos = useToasts((estado) => estado.mostrar);

  const [paso, setPaso] = useState<Paso>(1);
  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [distritoUbigeo, setDistritoUbigeo] = useState(distritos[0]?.ubigeo ?? "");
  const comunidadesDelDistrito = comunidades.filter((c) => c.distritoUbigeo === distritoUbigeo);
  const [comunidadId, setComunidadId] = useState(comunidadesDelDistrito[0]?.id ?? "");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const comunidadElegida = comunidades.find((c) => c.id === comunidadId) ?? null;
  const [coordenada, setCoordenada] = useState<Coordenada>(comunidadElegida?.centro ?? CENTRO_LIMA);
  const [guardandoPaso1, setGuardandoPaso1] = useState(false);
  const [errorPaso1, setErrorPaso1] = useState<string | null>(null);

  // Si se entra directo por URL, distritos/categorías todavía pueden estar vacíos en el primer
  // render (los carga LayoutAdmin en paralelo) — sin esto, el <select> se queda con un valor que
  // no existe todavía y "Comunidad" se ve vacío aunque el distrito sí tenga comunidades.
  useEffect(() => {
    if (!distritoUbigeo && distritos.length > 0) setDistritoUbigeo(distritos[0].ubigeo);
  }, [distritos, distritoUbigeo]);
  useEffect(() => {
    if (!comunidadId && comunidadesDelDistrito.length > 0) {
      setComunidadId(comunidadesDelDistrito[0].id);
      setCoordenada(comunidadesDelDistrito[0].centro);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comunidadesDelDistrito, comunidadId]);
  useEffect(() => {
    if (!categoriaId && categorias.length > 0) setCategoriaId(categorias[0].id);
  }, [categorias, categoriaId]);

  // Cuando cambia el distrito, si la comunidad elegida no es de ese distrito, se recentra en la
  // primera del distrito nuevo (y el mapa la sigue).
  function alCambiarDistrito(nuevoUbigeo: string) {
    setDistritoUbigeo(nuevoUbigeo);
    const primera = comunidades.find((c) => c.distritoUbigeo === nuevoUbigeo);
    setComunidadId(primera?.id ?? "");
    if (primera) setCoordenada(primera.centro);
  }
  function alCambiarComunidad(id: string) {
    setComunidadId(id);
    const c = comunidades.find((x) => x.id === id);
    if (c) setCoordenada(c.centro);
  }

  const categoriaActual = categorias.find((c) => c.id === categoriaId) ?? null;
  const atributosDef = categoriaActual?.atributosProducto ?? [];
  const mostrarSeccion = categoriaActual?.arquetipoFicha === "menu";

  // Dueño (paso 2)
  const cuentas = useCuentas((estado) => estado.cuentas);
  const cargarCuentas = useCuentas((estado) => estado.cargar);
  const crearCuenta = useCuentas((estado) => estado.crear);
  const agregarNegocio = useCuentas((estado) => estado.agregarNegocio);
  const [modoDueno, setModoDueno] = useState<"vincular" | "crear">("vincular");
  const [cuentaAVincular, setCuentaAVincular] = useState("");
  const [nombreDueno, setNombreDueno] = useState("");
  const [correoDueno, setCorreoDueno] = useState("");
  const [passwordPendiente, setPasswordPendiente] = useState<{ nombre: string; correo: string; contrasena: string } | null>(null);
  const cuentasDueno = cuentas.filter((c) => c.rol === "dueno_negocio");

  useEffect(() => {
    cargarCuentas(token);
  }, [cargarCuentas, token]);

  // Producto (paso 3/4)
  const [productoCreado, setProductoCreado] = useState<Producto | null>(null);
  const [modalProducto, setModalProducto] = useState<"nuevo" | "editar" | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const validoPaso1 = nombre.trim() && categoriaId && distritoUbigeo && comunidadId && direccion.trim();

  async function confirmarPaso1() {
    if (!validoPaso1) {
      setErrorPaso1("Falta el nombre, la categoría, el distrito/comunidad o la dirección.");
      return;
    }
    setGuardandoPaso1(true);
    setErrorPaso1(null);
    const id = await crearNegocio(
      {
        nombre: nombre.trim(),
        distritoUbigeo,
        comunidadId,
        categoriaIds: [categoriaId],
        direccion: direccion.trim(),
        telefono: telefono.trim() || null,
        whatsapp: whatsapp.trim() || null,
        coordenada,
      },
      token,
    );
    setGuardandoPaso1(false);
    if (!id) {
      setErrorPaso1("No se pudo crear el negocio. Intenta de nuevo.");
      return;
    }
    setNegocioId(id);
    setPaso(2);
    avisos("Negocio creado con éxito");
  }

  async function confirmarVincularDueno() {
    if (!negocioId || !cuentaAVincular) return;
    await agregarNegocio(cuentaAVincular, negocioId, token);
    setPaso(3);
    avisos("Dueño vinculado con éxito");
  }

  async function confirmarCrearDueno() {
    if (!negocioId || !nombreDueno.trim() || !correoDueno.trim()) return;
    const contrasena = generarContrasenaTemporal();
    const ok = await crearCuenta(
      { nombre: nombreDueno.trim(), correo: correoDueno.trim(), rol: "dueno_negocio", negocioIds: [negocioId], distritosAsignados: [] },
      contrasena,
      token,
    );
    if (ok) {
      setPasswordPendiente({ nombre: nombreDueno.trim(), correo: correoDueno.trim(), contrasena });
      setPaso(3);
    }
  }

  async function guardarPrimerProducto(datos: DatosProducto, fotoNueva: File | null) {
    if (!negocioId) return;
    const guardado = await productosApi.crearProducto(negocioId, datos, token);
    const final = fotoNueva ? await productosApi.subirFotoProducto(negocioId, guardado.id, fotoNueva, token) : guardado;
    setProductoCreado(final);
    setModalProducto(null);
    setPaso(4);
    avisos("Producto agregado con éxito");
  }

  async function guardarOtroProducto(datos: DatosProducto, fotoNueva: File | null) {
    if (!negocioId) return;
    const esNuevo = modalProducto === "nuevo";
    const guardado = esNuevo
      ? await productosApi.crearProducto(negocioId, datos, token)
      : await productosApi.actualizarProducto(negocioId, productoCreado!.id, datos, token);
    const final = fotoNueva ? await productosApi.subirFotoProducto(negocioId, guardado.id, fotoNueva, token) : guardado;
    setProductoCreado(final);
    setModalProducto(null);
    avisos(esNuevo ? "Producto agregado con éxito" : "Producto guardado con éxito");
  }

  const pasos: Paso[] = [1, 2, 3, 4];

  return (
    <div className="pantalla-registro">
      <div className="cabecera-registro">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" className="btn-volver-registro" onClick={() => navegar("/negocios")}>
            ←
          </button>
          <div>
            <span className="etiqueta-cabecera-registro">Registrar negocio</span>
            <h2 style={{ fontSize: 19, marginTop: 1 }}>{nombre.trim() || "Nuevo negocio"}</h2>
          </div>
        </div>
        <div className="stepper-registro">
          {pasos.map((p) => {
            const completado = p < paso;
            const activo = p === paso;
            const alcanzable = p <= paso || (negocioId !== null && p <= 3);
            return (
              <button
                type="button"
                key={p}
                className={`paso-stepper ${activo ? "activo" : ""} ${completado ? "completado" : ""}`}
                disabled={!alcanzable}
                onClick={() => alcanzable && setPaso(p)}
              >
                <span className="circulo-stepper">{completado ? "✓" : p}</span>
                <span className="etiqueta-stepper">{ETIQUETAS_PASO[p]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="contenido-registro">
        <div className="columna-registro">
          {paso === 1 ? (
            <div>
              <p className="ayuda-paso-registro">Datos básicos del negocio — la ficha completa se termina después.</p>
              <div className="tarjeta-paso-registro">
                <div className="seccion-alta">
                  <div className="titulo-seccion-alta">🏷️ Identidad</div>
                  <div className="fila-2-campos-alta">
                    <div className="campo-modal">
                      <label>Nombre del negocio</label>
                      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Panadería San José" autoFocus />
                    </div>
                    <div className="campo-modal">
                      <label>Categoría</label>
                      <SelectorCategoria categorias={categorias} valor={categoriaId} onCambiar={setCategoriaId} />
                    </div>
                  </div>
                </div>

                <div className="seccion-alta">
                  <div className="titulo-seccion-alta">📍 Ubicación</div>
                  <div className="fila-2-campos-alta">
                    <div className="campo-modal">
                      <label>Distrito</label>
                      <select value={distritoUbigeo} onChange={(e) => alCambiarDistrito(e.target.value)}>
                        {distritos.map((d) => (
                          <option key={d.ubigeo} value={d.ubigeo}>
                            {d.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="campo-modal">
                      <label>Comunidad</label>
                      <select value={comunidadId} onChange={(e) => alCambiarComunidad(e.target.value)}>
                        {comunidadesDelDistrito.length === 0 ? <option value="">Sin comunidades en este distrito</option> : null}
                        {comunidadesDelDistrito.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <CampoDireccionConMapa
                    direccion={direccion}
                    coordenada={coordenada}
                    cercaDe={comunidadElegida?.centro}
                    onCambiarDireccion={setDireccion}
                    onCambiarCoordenada={setCoordenada}
                  />
                  <p className="nota-sync-mapa">
                    Escribir la dirección centra el mapa; marcar en el mapa actualiza el texto — quedan sincronizados.
                  </p>
                </div>

                <div className="seccion-alta" style={{ borderBottom: "none" }}>
                  <div className="titulo-seccion-alta">
                    📞 Contacto <span className="opcional">(opcional)</span>
                  </div>
                  <div className="fila-2-campos-alta">
                    <div className="campo-modal" style={{ marginBottom: 0 }}>
                      <label>Teléfono</label>
                      <input
                        value={telefono}
                        onChange={(e) => setTelefono(soloDigitos(e.target.value))}
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="9 dígitos"
                      />
                    </div>
                    <div className="campo-modal" style={{ marginBottom: 0 }}>
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
                </div>
              </div>
              {errorPaso1 ? <div className="nota-alerta" style={{ marginTop: 12 }}>⚠️ {errorPaso1}</div> : null}
              <p className="ayuda-paso-registro" style={{ marginTop: 12 }}>
                El dueño no se pide acá — tiene su propio paso, con espacio para buscarlo o crearlo bien.
              </p>
            </div>
          ) : null}

          {paso === 2 ? (
            <div>
              <p className="ayuda-paso-registro">¿Quién administra este negocio? Se puede omitir y asignar después desde la ficha.</p>
              <div className="tabs-modo-dueno">
                <button
                  type="button"
                  className={`tab-modo-dueno ${modoDueno === "vincular" ? "activo" : ""}`}
                  onClick={() => setModoDueno("vincular")}
                >
                  🔗 Vincular cuenta existente
                </button>
                <button
                  type="button"
                  className={`tab-modo-dueno ${modoDueno === "crear" ? "activo" : ""}`}
                  onClick={() => setModoDueno("crear")}
                >
                  ✨ Crear cuenta nueva
                </button>
              </div>

              {modoDueno === "vincular" ? (
                <div className="tarjeta-paso-registro">
                  <input
                    placeholder="🔍 Buscar por nombre o correo…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ marginBottom: 10 }}
                  />
                  {cuentasDueno.length === 0 ? (
                    <p style={{ fontSize: 11.5, color: "var(--coral-fuerte)", margin: 0 }}>
                      Todavía no hay ninguna cuenta con rol "Dueño de negocio" creada.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {cuentasDueno
                        .filter(
                          (c) =>
                            c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            c.correo.toLowerCase().includes(busqueda.toLowerCase()),
                        )
                        .map((c) => (
                          <div
                            key={c.id}
                            className={`fila-dueno-candidato ${cuentaAVincular === c.id ? "activa" : ""}`}
                            onClick={() => setCuentaAVincular(c.id)}
                          >
                            <div>
                              <b style={{ fontSize: 13 }}>{c.nombre}</b>
                              <div style={{ fontSize: 11.5, color: "var(--texto-tenue)" }}>
                                {c.correo} · {c.negocioIds.length} negocio(s) a cargo
                              </div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--verde-fuerte)" }}>
                              {cuentaAVincular === c.id ? "✓ Elegido" : "Elegir"}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="tarjeta-paso-registro">
                  <div className="campo-modal">
                    <label>Nombre completo</label>
                    <input value={nombreDueno} onChange={(e) => setNombreDueno(e.target.value)} placeholder="Nombre del dueño" />
                  </div>
                  <div className="campo-modal" style={{ marginBottom: 0 }}>
                    <label>Correo</label>
                    <input value={correoDueno} onChange={(e) => setCorreoDueno(e.target.value)} placeholder="correo@ejemplo.com" />
                  </div>
                  <div className="nota-crear-dueno">
                    Se crea la cuenta con rol "Dueño de negocio" y una clave temporal para compartirle.
                  </div>
                </div>
              )}

              <button type="button" className="link-omitir-registro" onClick={() => setPaso(3)}>
                Omitir por ahora →
              </button>
            </div>
          ) : null}

          {paso === 3 ? (
            <div>
              <p className="ayuda-paso-registro">
                Último paso — agrega el primer producto o servicio. Los campos cambian según la categoría elegida en el paso 1.
              </p>
              <FormularioPrimerProducto atributosDef={atributosDef} onGuardar={guardarPrimerProducto} />
              <button type="button" className="link-omitir-registro" onClick={() => setPaso(4)}>
                Omitir, lo hago después →
              </button>
            </div>
          ) : null}

          {paso === 4 ? (
            <div>
              <div style={{ textAlign: "center", padding: "10px 0 18px" }}>
                <span style={{ fontSize: 34 }}>🎉</span>
                <h2 style={{ fontSize: 19, marginTop: 6 }}>¡Negocio registrado!</h2>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--texto-suave)" }}>
                  {nombre} ya está en el listado. Puedes seguir completando la ficha cuando quieras.
                </p>
              </div>

              {productoCreado ? (
                <>
                  <label style={{ display: "block", marginBottom: 8 }}>Producto agregado</label>
                  <div className="tarjeta-resumen-producto">
                    <div className="foto-servicio" style={{ width: 52, height: 52, borderRadius: 10, flex: "none" }}>
                      {productoCreado.fotoUrl ? <img src={urlCompleta(productoCreado.fotoUrl)} alt="" /> : "🖼️"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: 13 }}>{productoCreado.nombre}</b>
                      <div style={{ fontSize: 11.5, color: "var(--texto-tenue)" }}>
                        S/ {productoCreado.precio.toFixed(2)} · {categoriaActual?.nombre}
                      </div>
                    </div>
                    <button type="button" className="btn-accion-mini" onClick={() => setModalProducto("editar")}>
                      Editar
                    </button>
                  </div>
                </>
              ) : null}

              <button type="button" className="btn-agregar-otro-registro" onClick={() => setModalProducto("nuevo")}>
                + Agregar otro producto
              </button>

              <label style={{ display: "block", margin: "20px 0 8px" }}>Seguir completando el negocio</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="pill-accion-registro" onClick={() => negocioId && navegar(`/negocios/${negocioId}`)}>
                  ✏️ Editar información
                </button>
                <button
                  type="button"
                  className="pill-accion-registro"
                  onClick={() => negocioId && navegar(`/negocios/${negocioId}?tab=horario`)}
                >
                  🕒 Agregar horario
                </button>
                <button
                  type="button"
                  className="pill-accion-registro"
                  onClick={() => negocioId && navegar(`/negocios/${negocioId}?tab=fotos`)}
                >
                  📷 Agregar más fotos
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="barra-inferior-registro">
        <button
          type="button"
          className="btn-atras-registro"
          style={{ visibility: paso === 1 ? "hidden" : "visible" }}
          onClick={() => setPaso((p) => (p > 1 ? ((p - 1) as Paso) : p))}
        >
          ← Atrás
        </button>
        <span className="paso-actual-registro">Paso {paso} de 4</span>
        {paso === 1 ? (
          <button type="button" className="btn-siguiente-registro" disabled={guardandoPaso1} onClick={confirmarPaso1}>
            {guardandoPaso1 ? "Creando…" : "Siguiente →"}
          </button>
        ) : paso === 2 ? (
          <button
            type="button"
            className="btn-siguiente-registro"
            disabled={modoDueno === "vincular" ? !cuentaAVincular : !nombreDueno.trim() || !correoDueno.trim()}
            onClick={modoDueno === "vincular" ? confirmarVincularDueno : confirmarCrearDueno}
          >
            Siguiente →
          </button>
        ) : paso === 3 ? (
          <span />
        ) : (
          <button type="button" className="btn-siguiente-registro" onClick={() => negocioId && navegar(`/negocios/${negocioId}`)}>
            Ir a la ficha completa →
          </button>
        )}
      </div>

      {modalProducto === "nuevo" ? (
        <ModalProducto
          producto={null}
          moneda="PEN"
          seccionSugerida=""
          secciones={[]}
          atributosDef={atributosDef}
          mostrarSeccion={mostrarSeccion}
          onGuardar={guardarOtroProducto}
          onCerrar={() => setModalProducto(null)}
        />
      ) : null}
      {modalProducto === "editar" && productoCreado ? (
        <ModalProducto
          producto={productoCreado}
          moneda="PEN"
          seccionSugerida={productoCreado.categoriaMenu}
          secciones={[productoCreado.categoriaMenu]}
          atributosDef={atributosDef}
          mostrarSeccion={mostrarSeccion}
          onGuardar={guardarOtroProducto}
          onCerrar={() => setModalProducto(null)}
        />
      ) : null}

      {passwordPendiente ? (
        <ModalContrasenaGenerada
          titulo="Cuenta creada"
          nombre={passwordPendiente.nombre}
          correo={passwordPendiente.correo}
          contrasena={passwordPendiente.contrasena}
          onCerrar={() => setPasswordPendiente(null)}
        />
      ) : null}
    </div>
  );
}

/** Formulario del primer producto — foto, nombre, precio y atributos de la categoría. No es un
 * modal: vive directo en el paso 3, así no se rompe el flujo de pantalla completa. */
function FormularioPrimerProducto({
  atributosDef,
  onGuardar,
}: {
  atributosDef: AtributoProductoDef[];
  onGuardar: (datos: DatosProducto, foto: File | null) => Promise<void>;
}) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [atributos, setAtributos] = useState<Record<string, string>>({});
  const [foto, setFoto] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);
  const previsualizacion = foto ? URL.createObjectURL(foto) : null;

  const precioValido = precio.trim() !== "" && Number.isFinite(Number(precio)) && Number(precio) >= 0;
  const valido = nombre.trim() !== "" && precioValido;

  async function guardar() {
    if (!valido) return;
    setGuardando(true);
    await onGuardar(
      { nombre: nombre.trim(), descripcion: "", precio: Number(precio), categoriaMenu: "General", destacado: false, atributos },
      foto,
    );
    setGuardando(false);
  }

  return (
    <div className="tarjeta-paso-registro">
      <div style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 14 }}>
        <div>
          <div className="dropzone-foto-producto" onClick={() => inputFoto.current?.click()}>
            {previsualizacion ? <img src={previsualizacion} alt="" /> : <span>📷 Subir foto</span>}
          </div>
          <input
            ref={inputFoto}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              e.target.value = "";
              if (archivo) setFoto(archivo);
            }}
          />
        </div>
        <div>
          <div className="campo-modal">
            <label>Nombre del producto</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Casaca de jean" autoFocus />
          </div>
          <div className="campo-modal" style={{ marginBottom: 0 }}>
            <label>Precio (S/)</label>
            <input value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" />
          </div>
        </div>
      </div>

      {atributosDef.length > 0 ? (
        <>
          <div style={{ height: 1, background: "var(--borde)", margin: "14px 0" }} />
          <div className="fila-2-campos-alta">
            {atributosDef.map((def) => (
              <div className="campo-modal" key={def.clave}>
                <label>{def.etiqueta}</label>
                {def.tipo === "opciones" ? (
                  <select
                    value={atributos[def.clave] ?? ""}
                    onChange={(e) => setAtributos((a) => ({ ...a, [def.clave]: e.target.value }))}
                  >
                    <option value="">—</option>
                    {(def.opciones ?? []).map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                ) : def.tipo === "color" ? (
                  <SelectorColorAtributo
                    valor={atributos[def.clave] ?? ""}
                    onCambiar={(clave) => setAtributos((a) => ({ ...a, [def.clave]: clave }))}
                  />
                ) : (
                  <input
                    value={atributos[def.clave] ?? ""}
                    onChange={(e) => setAtributos((a) => ({ ...a, [def.clave]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button type="button" className="btn btn-primario" disabled={!valido || guardando} onClick={guardar}>
          {guardando ? "Guardando…" : "Publicar negocio ✓"}
        </button>
      </div>
    </div>
  );
}
