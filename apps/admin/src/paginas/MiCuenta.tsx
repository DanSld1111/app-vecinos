import { useRef, useState } from "react";
import { RolCuenta } from "@app-vecinos/tipos";
import { useSesionAdmin } from "../estado/useSesionAdmin";
import { urlCompleta } from "../utilidades/media";

const NOMBRE_ROL: Record<RolCuenta, string> = {
  super_admin: "Super-admin",
  dueno_negocio: "Dueño de negocio",
  junta_vecinal: "Junta vecinal",
  validador_contenido: "Validador de contenido",
  gestor_negocios: "Gestor de negocios",
};

const REGLAS_CLAVE = [
  { clave: "longitud", etiqueta: "8 o más caracteres", cumple: (v: string) => v.length >= 8 },
  { clave: "mayuscula", etiqueta: "Una letra mayúscula", cumple: (v: string) => /[A-Z]/.test(v) },
  { clave: "numero", etiqueta: "Un número", cumple: (v: string) => /[0-9]/.test(v) },
  { clave: "especial", etiqueta: "Un carácter especial", cumple: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function claveEsSegura(valor: string): boolean {
  return REGLAS_CLAVE.every((regla) => regla.cumple(valor));
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp";

export function MiCuenta() {
  const cuenta = useSesionAdmin((estado) => estado.cuenta);
  const cargando = useSesionAdmin((estado) => estado.cargando);
  const error = useSesionAdmin((estado) => estado.error);
  const limpiarError = useSesionAdmin((estado) => estado.limpiarError);
  const actualizarPerfilPropio = useSesionAdmin((estado) => estado.actualizarPerfilPropio);
  const cambiarClavePropia = useSesionAdmin((estado) => estado.cambiarClavePropia);
  const subirFotoPropia = useSesionAdmin((estado) => estado.subirFotoPropia);

  const [nombre, setNombre] = useState(cuenta?.nombre ?? "");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [nombreGuardado, setNombreGuardado] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [cambiandoClave, setCambiandoClave] = useState(false);
  const [claveCambiada, setClaveCambiada] = useState(false);

  if (!cuenta) return null;

  const nombreValido = nombre.trim().length > 0;
  const huboCambioNombre = nombre.trim() !== cuenta.nombre;
  const claveSegura = claveEsSegura(claveNueva);
  const clavesCoinciden = confirmarClave.length > 0 && claveNueva === confirmarClave;
  const puedeCambiarClave = claveActual.trim().length > 0 && claveSegura && clavesCoinciden && !cambiandoClave;

  async function alGuardarNombre() {
    if (!huboCambioNombre || !nombreValido) return;
    setGuardandoNombre(true);
    const ok = await actualizarPerfilPropio(nombre.trim());
    setGuardandoNombre(false);
    if (ok) {
      setNombreGuardado(true);
      setTimeout(() => setNombreGuardado(false), 2500);
    }
  }

  async function alElegirFoto(archivo: File) {
    setSubiendoFoto(true);
    await subirFotoPropia(archivo);
    setSubiendoFoto(false);
  }

  async function alCambiarClave() {
    if (!puedeCambiarClave) return;
    setCambiandoClave(true);
    const ok = await cambiarClavePropia(claveActual, claveNueva);
    setCambiandoClave(false);
    if (ok) {
      setClaveActual("");
      setClaveNueva("");
      setConfirmarClave("");
      setClaveCambiada(true);
      setTimeout(() => setClaveCambiada(false), 2500);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>Mi cuenta</h2>
          <p>Tu perfil personal — {NOMBRE_ROL[cuenta.rol]}</p>
        </div>
      </div>

      {error ? (
        <div
          className="panel"
          style={{
            padding: 12,
            marginBottom: 16,
            color: "var(--rojo)",
            background: "var(--rojo-suave)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button className="btn-accion-mini" onClick={limpiarError}>
            ✕
          </button>
        </div>
      ) : null}

      <div className="tarjeta" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <input
          ref={inputFotoRef}
          type="file"
          accept={TIPOS_ACEPTADOS}
          style={{ display: "none" }}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = "";
            if (archivo) alElegirFoto(archivo);
          }}
        />
        {cuenta.fotoUrl ? (
          <img
            src={urlCompleta(cuenta.fotoUrl)}
            alt={cuenta.nombre}
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flex: "none" }}
          />
        ) : (
          <div
            className="avatar-rol"
            style={{ width: 64, height: 64, fontSize: 20, background: "var(--verde)", flex: "none" }}
          >
            {iniciales(cuenta.nombre)}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <b style={{ display: "block", fontSize: 15 }}>{cuenta.nombre}</b>
          <span style={{ fontSize: 11.5, color: "var(--texto-suave)" }}>{cuenta.correo}</span>
        </div>
        <button
          type="button"
          className="btn-accion-mini"
          disabled={subiendoFoto}
          onClick={() => inputFotoRef.current?.click()}
        >
          {subiendoFoto ? "Subiendo…" : cuenta.fotoUrl ? "Cambiar foto" : "Subir foto"}
        </button>
      </div>

      <div className="tarjeta" style={{ marginBottom: 16 }}>
        <div className="campo-modal">
          <label>Nombre completo</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div className="campo-modal">
          <label>Correo</label>
          <input value={cuenta.correo} disabled />
          <div className="nota-alcance">
            El correo es con el que iniciás sesión — no se puede cambiar acá. Si necesitás uno nuevo, pedile a un
            super-admin que lo actualice desde Cuentas.
          </div>
        </div>

        {nombreGuardado ? (
          <div className="panel" style={{ padding: "8px 12px", background: "var(--verde-suave)", color: "var(--verde-fuerte)", fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
            ✓ Guardado.
          </div>
        ) : null}

        <button
          className="btn btn-primario"
          disabled={!huboCambioNombre || !nombreValido || guardandoNombre}
          onClick={alGuardarNombre}
        >
          {guardandoNombre ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="tarjeta">
        <h3 style={{ fontSize: 14, marginBottom: 4 }}>Cambiar contraseña</h3>
        <p className="sub" style={{ marginTop: 0, marginBottom: 14 }}>
          Tenés que confirmar tu contraseña actual antes de poner una nueva.
        </p>

        <div className="campo-modal">
          <label>Contraseña actual</label>
          <input type="password" value={claveActual} onChange={(e) => setClaveActual(e.target.value)} placeholder="Tu contraseña de ahora" />
        </div>

        <div className="campo-modal" style={{ marginBottom: 6 }}>
          <label>Contraseña nueva</label>
          <input type="password" value={claveNueva} onChange={(e) => setClaveNueva(e.target.value)} placeholder="Contraseña segura" />
        </div>

        {claveNueva.length > 0 ? (
          <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 3 }}>
            {REGLAS_CLAVE.map((regla) => {
              const cumple = regla.cumple(claveNueva);
              return (
                <span key={regla.clave} style={{ fontSize: 11, color: cumple ? "var(--verde-fuerte)" : "var(--texto-tenue)" }}>
                  {cumple ? "✓" : "○"} {regla.etiqueta}
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="campo-modal" style={{ marginBottom: 6 }}>
          <label>Confirmá la contraseña nueva</label>
          <input type="password" value={confirmarClave} onChange={(e) => setConfirmarClave(e.target.value)} placeholder="Repetila" />
        </div>
        {confirmarClave.length > 0 && !clavesCoinciden ? (
          <p style={{ fontSize: 11, color: "var(--rojo)", marginTop: 0, marginBottom: 12 }}>Las contraseñas no coinciden.</p>
        ) : (
          <div style={{ marginBottom: 12 }} />
        )}

        {claveCambiada ? (
          <div className="panel" style={{ padding: "8px 12px", background: "var(--verde-suave)", color: "var(--verde-fuerte)", fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
            ✓ Contraseña actualizada.
          </div>
        ) : null}

        <button className="btn btn-primario" disabled={!puedeCambiarClave} onClick={alCambiarClave}>
          {cambiandoClave ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </div>
    </>
  );
}
