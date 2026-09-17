import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../disenio";
import { useSesionCuenta } from "../../estado/useSesionCuenta";

/**
 * Login del "modo gestión" (dueño de negocio / junta vecinal) — deliberadamente
 * separado de `FlujoLogin` (vecino): otro token, otro backend de auth, y acá no
 * hay "crear cuenta" porque las cuentas de gestión las crea el equipo ELISUR
 * desde el panel, no la propia persona.
 */
function CampoTexto({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={{ marginBottom: espaciado.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.campo}>
        <TextInput style={styles.input} placeholderTextColor={colores.textoTenue} {...props} />
      </View>
    </View>
  );
}

function CampoClave({ label, valor, onCambiar, placeholder }: { label: string; valor: string; onCambiar: (v: string) => void; placeholder: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ marginBottom: espaciado.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.campo, styles.campoConIcono]}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor={colores.textoTenue}
          value={valor}
          onChangeText={onCambiar}
          secureTextEntry={!visible}
          autoCapitalize="none"
        />
        <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8}>
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={18} color={colores.textoTenue} />
        </Pressable>
      </View>
    </View>
  );
}

const REGLAS_CLAVE = [
  { clave: "longitud", etiqueta: "8 o más caracteres", cumple: (v: string) => v.length >= 8 },
  { clave: "mayuscula", etiqueta: "Una letra mayúscula", cumple: (v: string) => /[A-Z]/.test(v) },
  { clave: "numero", etiqueta: "Un número", cumple: (v: string) => /[0-9]/.test(v) },
  { clave: "especial", etiqueta: "Un carácter especial", cumple: (v: string) => /[^A-Za-z0-9]/.test(v) },
];
function claveEsSegura(valor: string): boolean {
  return REGLAS_CLAVE.every((regla) => regla.cumple(valor));
}

type Paso = "ingreso" | "olvide-correo" | "olvide-codigo";

export function LoginCuenta({ onCerrar }: { onCerrar: () => void }) {
  const [paso, setPaso] = useState<Paso>("ingreso");
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");

  if (paso === "olvide-correo") {
    return (
      <PantallaOlvideClave
        onVolver={() => setPaso("ingreso")}
        onEnviado={(correo) => {
          setCorreoRecuperacion(correo);
          setPaso("olvide-codigo");
        }}
      />
    );
  }
  if (paso === "olvide-codigo") {
    return <PantallaRestablecerClave correo={correoRecuperacion} onListo={() => setPaso("ingreso")} onVolver={() => setPaso("olvide-correo")} />;
  }
  return <PantallaIngreso onOlvideClave={() => setPaso("olvide-correo")} onCerrar={onCerrar} />;
}

function PantallaIngreso({ onOlvideClave, onCerrar }: { onOlvideClave: () => void; onCerrar: () => void }) {
  const colores = useColores();
  const insets = useSafeAreaInsets();
  const styles = crearEstilos(colores, insets.top);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const iniciarSesion = useSesionCuenta((estado) => estado.iniciarSesion);
  const cargando = useSesionCuenta((estado) => estado.cargando);
  const error = useSesionCuenta((estado) => estado.error);
  const limpiarError = useSesionCuenta((estado) => estado.limpiarError);

  const puedeContinuar = /\S+@\S+\.\S+/.test(correo) && contrasena.length > 0 && !cargando;

  return (
    <View style={styles.pantalla}>
      <Pressable style={styles.volver} onPress={onCerrar}>
        <Ionicons name="chevron-back" size={18} color={colores.textoSuave} />
        <Text style={styles.volverTexto}>Atrás</Text>
      </Pressable>

      <View style={styles.marcaMini}>
        <View style={styles.puntoMarca}>
          <Ionicons name="briefcase" size={16} color="#fff" />
        </View>
        <Text style={styles.marcaNombre}>Modo gestión</Text>
      </View>

      <Text style={styles.titulo}>Ingresa con tu cuenta</Text>
      <Text style={styles.desc}>Para dueños de negocio y junta vecinal — con la misma cuenta que usas en el panel de administración.</Text>

      <CampoTexto
        label="Correo"
        placeholder="tucorreo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={correo}
        onChangeText={(v) => {
          setCorreo(v);
          limpiarError();
        }}
      />
      <CampoClave
        label="Contraseña"
        placeholder="Tu contraseña"
        valor={contrasena}
        onCambiar={(v) => {
          setContrasena(v);
          limpiarError();
        }}
      />

      <Pressable onPress={onOlvideClave} style={{ alignSelf: "flex-end", marginBottom: espaciado.md }}>
        <Text style={styles.enlaceFuerte}>¿Olvidaste tu contraseña?</Text>
      </Pressable>

      {error ? (
        <View style={styles.cajaError}>
          <Ionicons name="alert-circle" size={16} color={colores.error} />
          <Text style={styles.textoError}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.boton, { opacity: puedeContinuar ? 1 : 0.45 }]}
        onPress={puedeContinuar ? () => iniciarSesion(correo.trim(), contrasena) : undefined}
      >
        <Text style={styles.botonTexto}>{cargando ? "Ingresando…" : "Ingresar"}</Text>
      </Pressable>
      {cargando ? <ActivityIndicator color={colores.primarioFuerte} style={{ marginTop: espaciado.md }} /> : null}
    </View>
  );
}

function PantallaOlvideClave({ onVolver, onEnviado }: { onVolver: () => void; onEnviado: (correo: string) => void }) {
  const colores = useColores();
  const insets = useSafeAreaInsets();
  const styles = crearEstilos(colores, insets.top);
  const [correo, setCorreo] = useState("");
  const olvideClave = useSesionCuenta((estado) => estado.olvideClave);
  const cargando = useSesionCuenta((estado) => estado.cargando);
  const error = useSesionCuenta((estado) => estado.error);
  const limpiarError = useSesionCuenta((estado) => estado.limpiarError);
  const puedeContinuar = /\S+@\S+\.\S+/.test(correo) && !cargando;

  async function alEnviar() {
    if (!puedeContinuar) return;
    const ok = await olvideClave(correo.trim());
    if (ok) onEnviado(correo.trim());
  }

  return (
    <View style={styles.pantalla}>
      <Pressable style={styles.volver} onPress={onVolver}>
        <Ionicons name="chevron-back" size={18} color={colores.textoSuave} />
        <Text style={styles.volverTexto}>Atrás</Text>
      </Pressable>
      <Text style={styles.titulo}>Recuperar contraseña</Text>
      <Text style={styles.desc}>Ingresa tu correo y te enviaremos un código para crear una contraseña nueva.</Text>
      <CampoTexto
        label="Correo"
        placeholder="tucorreo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={correo}
        onChangeText={(v) => {
          setCorreo(v);
          limpiarError();
        }}
      />
      {error ? (
        <View style={styles.cajaError}>
          <Ionicons name="alert-circle" size={16} color={colores.error} />
          <Text style={styles.textoError}>{error}</Text>
        </View>
      ) : null}
      <Pressable style={[styles.boton, { opacity: puedeContinuar ? 1 : 0.45 }]} onPress={alEnviar}>
        <Text style={styles.botonTexto}>{cargando ? "Enviando…" : "Enviar código"}</Text>
      </Pressable>
    </View>
  );
}

function PantallaRestablecerClave({ correo, onListo, onVolver }: { correo: string; onListo: () => void; onVolver: () => void }) {
  const colores = useColores();
  const insets = useSafeAreaInsets();
  const styles = crearEstilos(colores, insets.top);
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [listo, setListo] = useState(false);
  const restablecerClave = useSesionCuenta((estado) => estado.restablecerClave);
  const cargando = useSesionCuenta((estado) => estado.cargando);
  const error = useSesionCuenta((estado) => estado.error);

  const claveSegura = claveEsSegura(clave);
  const clavesCoinciden = confirmar.length > 0 && clave === confirmar;
  const puedeContinuar = codigo.length === 6 && claveSegura && clavesCoinciden && !cargando;

  async function alConfirmar() {
    if (!puedeContinuar) return;
    const ok = await restablecerClave(correo, codigo, clave);
    if (ok) setListo(true);
  }

  if (listo) {
    return (
      <View style={styles.pantalla}>
        <View style={{ marginTop: "auto", marginBottom: "auto", alignItems: "center" }}>
          <Ionicons name="checkmark-circle" size={56} color={colores.exito} style={{ marginBottom: espaciado.lg }} />
          <Text style={[styles.titulo, { textAlign: "center", fontSize: 20 }]}>Contraseña actualizada</Text>
          <Text style={[styles.desc, { textAlign: "center" }]}>Ya puedes iniciar sesión con tu contraseña nueva.</Text>
        </View>
        <Pressable style={styles.boton} onPress={onListo}>
          <Text style={styles.botonTexto}>Ir a iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <Pressable style={styles.volver} onPress={onVolver}>
        <Ionicons name="chevron-back" size={18} color={colores.textoSuave} />
        <Text style={styles.volverTexto}>Atrás</Text>
      </Pressable>
      <Text style={styles.titulo}>Ingresa el código</Text>
      <Text style={styles.desc}>
        Enviamos un código de 6 dígitos a <Text style={{ fontFamily: "PlusJakartaSans_700Bold", color: colores.texto }}>{correo}</Text>.
      </Text>
      <CampoTexto label="Código de 6 dígitos" placeholder="123456" keyboardType="number-pad" maxLength={6} value={codigo} onChangeText={(v) => setCodigo(v.replace(/\D/g, "").slice(0, 6))} />
      <CampoClave label="Contraseña nueva" placeholder="Contraseña segura" valor={clave} onCambiar={setClave} />
      {clave.length > 0 ? (
        <View style={{ marginTop: -espaciado.sm, marginBottom: espaciado.md, gap: 4 }}>
          {REGLAS_CLAVE.map((regla) => {
            const cumple = regla.cumple(clave);
            return (
              <View key={regla.clave} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name={cumple ? "checkmark-circle" : "ellipse-outline"} size={14} color={cumple ? colores.exito : colores.textoTenue} />
                <Text style={{ ...tipografia.pie, fontSize: 11.5, color: cumple ? colores.exito : colores.textoTenue }}>{regla.etiqueta}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
      <CampoClave label="Confirma la contraseña" placeholder="Repite tu contraseña" valor={confirmar} onCambiar={setConfirmar} />
      {confirmar.length > 0 && !clavesCoinciden ? (
        <Text style={{ ...tipografia.pie, fontSize: 11.5, color: colores.error, marginTop: -espaciado.sm, marginBottom: espaciado.sm }}>Las contraseñas no coinciden.</Text>
      ) : null}
      {error ? (
        <View style={styles.cajaError}>
          <Ionicons name="alert-circle" size={16} color={colores.error} />
          <Text style={styles.textoError}>{error}</Text>
        </View>
      ) : null}
      <Pressable style={[styles.boton, { opacity: puedeContinuar ? 1 : 0.45 }]} onPress={alConfirmar}>
        <Text style={styles.botonTexto}>{cargando ? "Guardando…" : "Cambiar contraseña"}</Text>
      </Pressable>
    </View>
  );
}

function crearEstilos(colores: PaletaColores, insetTop = 0) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo, paddingHorizontal: espaciado.xl, paddingTop: espaciado.xl + insetTop, paddingBottom: espaciado.xl },
    volver: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: espaciado.lg, alignSelf: "flex-start" },
    volverTexto: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.textoSuave },
    marcaMini: { flexDirection: "row", alignItems: "center", gap: espaciado.sm, marginBottom: espaciado.lg },
    puntoMarca: { width: 30, height: 30, borderRadius: 9, backgroundColor: colores.texto, alignItems: "center", justifyContent: "center" },
    marcaNombre: { ...tipografia.display, fontSize: 16, color: colores.texto },
    titulo: { ...tipografia.displayGrande, color: colores.texto, marginBottom: espaciado.sm },
    desc: { ...tipografia.cuerpo, color: colores.textoSuave, marginBottom: espaciado.xl },
    label: { ...tipografia.etiqueta, color: colores.textoSuave, marginBottom: espaciado.xs },
    campo: { borderWidth: 1.5, borderColor: colores.borde, borderRadius: radios.md, paddingHorizontal: espaciado.md, paddingVertical: espaciado.sm + 2 },
    campoConIcono: { flexDirection: "row", alignItems: "center", gap: espaciado.sm },
    input: { ...tipografia.cuerpoDestacado, color: colores.texto },
    enlaceFuerte: { ...tipografia.pie, color: colores.acentoFuerte, fontFamily: "PlusJakartaSans_700Bold" },
    boton: { height: 46, borderRadius: radios.md, alignItems: "center", justifyContent: "center", backgroundColor: colores.texto },
    botonTexto: { ...tipografia.cuerpoDestacado, color: "#fff" },
    cajaError: { flexDirection: "row", alignItems: "center", gap: espaciado.xs, backgroundColor: colores.acentoSuave, borderRadius: radios.md, paddingHorizontal: espaciado.md, paddingVertical: espaciado.sm, marginBottom: espaciado.md },
    textoError: { ...tipografia.pie, color: colores.error, flex: 1 },
  });
}
