import { useState } from "react";
import { Navigate } from "react-router-dom";
import { IoEyeOffOutline, IoEyeOutline, IoLockClosedOutline, IoMailOutline } from "react-icons/io5";
import { useSesionAdmin } from "../estado/useSesionAdmin";

const REGLAS_CLAVE = [
  { clave: "longitud", etiqueta: "8 o más caracteres", cumple: (v: string) => v.length >= 8 },
  { clave: "mayuscula", etiqueta: "Una letra mayúscula", cumple: (v: string) => /[A-Z]/.test(v) },
  { clave: "numero", etiqueta: "Un número", cumple: (v: string) => /[0-9]/.test(v) },
  { clave: "especial", etiqueta: "Un carácter especial", cumple: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function claveEsSegura(valor: string): boolean {
  return REGLAS_CLAVE.every((regla) => regla.cumple(valor));
}

type Vista = "login" | "recuperar-correo" | "recuperar-codigo";

function MarcaMini() {
  return (
    <div className="marca-mini">
      <div className="punto">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span>ELISUR admin</span>
    </div>
  );
}

function MarcaGrande() {
  return (
    <div className="marca-grande">
      <div className="punto">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span>ELISUR admin</span>
    </div>
  );
}

export function Login() {
  const cuenta = useSesionAdmin((estado) => estado.cuenta);
  const [vista, setVista] = useState<Vista>("login");
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");

  if (cuenta) return <Navigate to="/" replace />;

  if (vista === "recuperar-correo") {
    return (
      <PantallaOlvideClave
        onVolver={() => setVista("login")}
        onEnviado={(correo) => {
          setCorreoRecuperacion(correo);
          setVista("recuperar-codigo");
        }}
      />
    );
  }

  if (vista === "recuperar-codigo") {
    return (
      <PantallaRestablecerClave
        correo={correoRecuperacion}
        onListo={() => setVista("login")}
        onVolver={() => setVista("recuperar-correo")}
      />
    );
  }

  return <PantallaLogin onOlvideClave={() => setVista("recuperar-correo")} />;
}

function PantallaLogin({ onOlvideClave }: { onOlvideClave: () => void }) {
  const error = useSesionAdmin((estado) => estado.error);
  const cargando = useSesionAdmin((estado) => estado.cargando);
  const iniciarSesion = useSesionAdmin((estado) => estado.iniciarSesion);
  const limpiarError = useSesionAdmin((estado) => estado.limpiarError);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [claveVisible, setClaveVisible] = useState(false);

  function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciarSesion(correo, contrasena);
  }

  return (
    <div className="login-split">
      <div className="login-panel-marca">
        <svg className="anillos" width="320" height="320" viewBox="0 0 320 320" fill="none" aria-hidden="true">
          <circle cx="160" cy="160" r="159" stroke="#fff" strokeWidth="1" />
          <circle cx="160" cy="160" r="110" stroke="#fff" strokeWidth="1" />
          <circle cx="160" cy="160" r="60" stroke="#fff" strokeWidth="1" />
        </svg>

        <MarcaGrande />

        <div className="login-mensaje">
          <h1>
            Todo tu barrio,
            <br />
            en un solo lugar.
          </h1>
          <p>Negocios, avisos, publicidad y comunidad de San Borja — administrados desde un mismo panel.</p>
        </div>

        <div className="login-stats">
          <div>
            <b>4</b>
            <span>Distritos piloto</span>
          </div>
          <div className="separador" />
          <div>
            <b>24/7</b>
            <span>Acceso al panel</span>
          </div>
        </div>
      </div>

      <div className="login-panel-form">
        <form className="login-form-ancho" onSubmit={alEnviar}>
          <h2>Bienvenido de nuevo</h2>
          <p>Ingresa con tu cuenta para administrar ELISUR.</p>

          {error ? <div className="error-login">{error}</div> : null}

          <div className="campo-icono">
            <label>Correo</label>
            <div className="campo-icono-fila">
              <IoMailOutline size={17} />
              <input
                type="email"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  limpiarError();
                }}
                placeholder="tucorreo@elisur.com"
                autoFocus
              />
            </div>
          </div>

          <div className="campo-icono">
            <label>Contraseña</label>
            <div className="campo-icono-fila">
              <IoLockClosedOutline size={17} />
              <input
                type={claveVisible ? "text" : "password"}
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  limpiarError();
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setClaveVisible((visible) => !visible)}
                aria-label={claveVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {claveVisible ? <IoEyeOffOutline size={16} /> : <IoEyeOutline size={16} />}
              </button>
            </div>
          </div>

          <div className="login-olvide">
            <button type="button" onClick={onOlvideClave}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="submit" className="login-btn-ingresar" disabled={cargando}>
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>

          <div className="login-separador">
            <div />
            <span>Cuentas de prueba</span>
            <div />
          </div>

          <div className="credenciales-demo-caja">
            <p>
              <b>Super-admin</b> · admin@elisur.com / admin123
            </p>
            <p>
              <b>Dueño de negocio</b> · dueno@elisur.com / negocio123
            </p>
            <p>
              <b>Junta vecinal</b> · junta@elisur.com / junta123
            </p>
            <p>
              <b>Validador</b> · validador@elisur.com / validar123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function PantallaOlvideClave({ onVolver, onEnviado }: { onVolver: () => void; onEnviado: (correo: string) => void }) {
  const error = useSesionAdmin((estado) => estado.error);
  const cargando = useSesionAdmin((estado) => estado.cargando);
  const olvideClave = useSesionAdmin((estado) => estado.olvideClave);
  const limpiarError = useSesionAdmin((estado) => estado.limpiarError);
  const [correo, setCorreo] = useState("");

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    const ok = await olvideClave(correo);
    if (ok) onEnviado(correo);
  }

  return (
    <div className="pantalla-centro">
      <form className="card-login" onSubmit={alEnviar}>
        <MarcaMini />
        <h3 style={{ margin: "0 0 6px" }}>Recuperar contraseña</h3>
        <p style={{ fontSize: 14.5, color: "var(--texto-suave, #5f6b5c)", marginTop: 0, marginBottom: 21 }}>
          Ingresa el correo de tu cuenta y te enviaremos un código para crear una contraseña nueva.
        </p>

        {error ? <div className="error-login">{error}</div> : null}

        <div className="campo" style={{ marginBottom: 21 }}>
          <label>Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => {
              setCorreo(e.target.value);
              limpiarError();
            }}
            placeholder="tucorreo@elisur.com"
            autoFocus
          />
        </div>

        <button type="submit" className="btn btn-primario btn-bloque" disabled={cargando || !correo.trim()}>
          {cargando ? "Enviando…" : "Enviar código"}
        </button>

        <button
          type="button"
          onClick={onVolver}
          style={{ background: "none", border: "none", padding: 0, marginTop: 16, cursor: "pointer", fontSize: 14, color: "var(--texto-suave, #5f6b5c)", fontWeight: 700, width: "100%" }}
        >
          ← Volver a iniciar sesión
        </button>
      </form>
    </div>
  );
}

function PantallaRestablecerClave({
  correo,
  onListo,
  onVolver,
}: {
  correo: string;
  onListo: () => void;
  onVolver: () => void;
}) {
  const error = useSesionAdmin((estado) => estado.error);
  const cargando = useSesionAdmin((estado) => estado.cargando);
  const restablecerClave = useSesionAdmin((estado) => estado.restablecerClave);
  const limpiarError = useSesionAdmin((estado) => estado.limpiarError);
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [listo, setListo] = useState(false);

  const claveSegura = claveEsSegura(clave);
  const clavesCoinciden = confirmar.length > 0 && clave === confirmar;
  const puedeEnviar = codigo.trim().length === 6 && claveSegura && clavesCoinciden && !cargando;

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!puedeEnviar) return;
    const ok = await restablecerClave(correo, codigo.trim(), clave);
    if (ok) setListo(true);
  }

  if (listo) {
    return (
      <div className="pantalla-centro">
        <div className="card-login">
          <MarcaMini />
          <h3 style={{ margin: "0 0 6px" }}>Contraseña actualizada</h3>
          <p style={{ fontSize: 14.5, color: "var(--texto-suave, #5f6b5c)", marginBottom: 23 }}>
            Ya puedes iniciar sesión con tu contraseña nueva.
          </p>
          <button type="button" className="btn btn-primario btn-bloque" onClick={onListo}>
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pantalla-centro">
      <form className="card-login" onSubmit={alEnviar}>
        <MarcaMini />
        <h3 style={{ margin: "0 0 6px" }}>Ingresa el código</h3>
        <p style={{ fontSize: 14.5, color: "var(--texto-suave, #5f6b5c)", marginTop: 0, marginBottom: 21 }}>
          Enviamos un código de 6 dígitos a <b>{correo}</b>. Escríbelo junto con tu contraseña nueva.
        </p>

        {error ? <div className="error-login">{error}</div> : null}

        <div className="campo" style={{ marginBottom: 14 }}>
          <label>Código de 6 dígitos</label>
          <input
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
              limpiarError();
            }}
            placeholder="123456"
            inputMode="numeric"
            autoFocus
          />
        </div>

        <div className="campo" style={{ marginBottom: 7 }}>
          <label>Contraseña nueva</label>
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Contraseña segura" />
        </div>

        {clave.length > 0 ? (
          <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 3.5 }}>
            {REGLAS_CLAVE.map((regla) => {
              const cumple = regla.cumple(clave);
              return (
                <span key={regla.clave} style={{ fontSize: 13, color: cumple ? "var(--verde-fuerte, #1f8a5a)" : "var(--texto-tenue, #96a091)" }}>
                  {cumple ? "✓" : "○"} {regla.etiqueta}
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="campo" style={{ marginBottom: 7 }}>
          <label>Confirma la contraseña</label>
          <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} placeholder="Repite tu contraseña" />
        </div>
        {confirmar.length > 0 && !clavesCoinciden ? (
          <p style={{ fontSize: 13, color: "var(--rojo, #c0392b)", marginTop: 0, marginBottom: 14 }}>Las contraseñas no coinciden.</p>
        ) : (
          <div style={{ marginBottom: 14 }} />
        )}

        <button type="submit" className="btn btn-primario btn-bloque" disabled={!puedeEnviar}>
          {cargando ? "Guardando…" : "Cambiar contraseña"}
        </button>

        <button
          type="button"
          onClick={onVolver}
          style={{ background: "none", border: "none", padding: 0, marginTop: 16, cursor: "pointer", fontSize: 14, color: "var(--texto-suave, #5f6b5c)", fontWeight: 700, width: "100%" }}
        >
          ← Pedir otro código
        </button>
      </form>
    </div>
  );
}
