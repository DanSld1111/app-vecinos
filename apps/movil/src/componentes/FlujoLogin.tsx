import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { marca } from "../config/marca";
import { useComunidadActiva } from "../estado/comunidadActiva";
import { useSesion } from "../estado/useSesion";
import { BotonPrimario } from "./BotonPrimario";

type Paso = "ingreso" | "registro" | "olvide-correo" | "olvide-codigo";

const REGLAS_CLAVE = [
  { clave: "longitud", etiqueta: "8 o más caracteres", cumple: (v: string) => v.length >= 8 },
  { clave: "mayuscula", etiqueta: "Una letra mayúscula", cumple: (v: string) => /[A-Z]/.test(v) },
  { clave: "numero", etiqueta: "Un número", cumple: (v: string) => /[0-9]/.test(v) },
  { clave: "especial", etiqueta: "Un carácter especial", cumple: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function claveEsSegura(valor: string): boolean {
  return REGLAS_CLAVE.every((regla) => regla.cumple(valor));
}

export function FlujoLogin() {
  const [paso, setPaso] = useState<Paso>("ingreso");
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");
  const continuarComoInvitado = useSesion((estado) => estado.continuarComoInvitado);

  if (paso === "registro") {
    return <PantallaRegistro onVolver={() => setPaso("ingreso")} />;
  }

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
    return (
      <PantallaRestablecerClave
        correo={correoRecuperacion}
        onListo={() => setPaso("ingreso")}
        onVolver={() => setPaso("olvide-correo")}
      />
    );
  }

  return (
    <PantallaIngreso
      onIrARegistro={() => setPaso("registro")}
      onOlvideClave={() => setPaso("olvide-correo")}
      onSaltar={continuarComoInvitado}
    />
  );
}

function IsotipoBlanco({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M13 11 H23 M13 11 V29 M13 20 H20 M13 29 H21"
        stroke="#fff"
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M21 21 C21 15 26 11.5 31 10.5 C29.5 16 26 20 21 21 Z" fill="#fff" />
    </Svg>
  );
}

function BotonGoogle() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.botonSocial}>
      <Ionicons name="logo-google" size={18} color={colores.textoSuave} />
      <Text style={styles.botonSocialTexto}>Continuar con Google</Text>
      <Text style={styles.etiquetaProximamente}>Próximamente</Text>
    </View>
  );
}

function CampoTexto({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={{ marginBottom: espaciado.md }}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={styles.campoGenerico}>
        <TextInput
          style={styles.inputGenerico}
          placeholderTextColor={colores.textoTenue}
          {...props}
        />
      </View>
    </View>
  );
}

function CampoClave({
  label,
  valor,
  onCambiar,
  placeholder,
}: {
  label: string;
  valor: string;
  onCambiar: (v: string) => void;
  placeholder: string;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ marginBottom: espaciado.md }}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={[styles.campoGenerico, styles.campoConIcono]}>
        <TextInput
          style={[styles.inputGenerico, { flex: 1 }]}
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

function MensajeError({ mensaje }: { mensaje: string | null }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  if (!mensaje) return null;
  return (
    <View style={styles.cajaError}>
      <Ionicons name="alert-circle" size={16} color={colores.error} />
      <Text style={styles.textoError}>{mensaje}</Text>
    </View>
  );
}

function PantallaIngreso({
  onIrARegistro,
  onOlvideClave,
  onSaltar,
}: {
  onIrARegistro: () => void;
  onOlvideClave: () => void;
  onSaltar: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const iniciarSesion = useSesion((estado) => estado.iniciarSesion);
  const cargando = useSesion((estado) => estado.cargando);
  const error = useSesion((estado) => estado.error);
  const limpiarError = useSesion((estado) => estado.limpiarError);

  const puedeContinuar = /\S+@\S+\.\S+/.test(correo) && contrasena.length > 0 && !cargando;

  return (
    <View style={styles.pantallaIngreso}>
      <View style={styles.circuloA} />
      <View style={styles.circuloB} />

      <ScrollView contentContainerStyle={styles.scrollIngreso} showsVerticalScrollIndicator={false}>
      <View style={styles.insignia}>
        <IsotipoBlanco size={26} />
      </View>
      <Text style={styles.insigniaTexto}>{marca.nombreApp}</Text>
      <Text style={styles.tituloIngreso}>
        Uniendo a cada vecino para hacer crecer la comunidad de nuestro distrito
      </Text>

      <View style={styles.tarjetaIngreso}>
        <Text style={styles.tarjetaTitulo}>Ingresar</Text>

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
          <Text style={styles.enlaceTextoFuerte}>¿Olvidaste tu contraseña?</Text>
        </Pressable>

        <MensajeError mensaje={error} />

        <BotonPrimario
          texto={cargando ? "Ingresando…" : "Continuar"}
          onPress={puedeContinuar ? () => iniciarSesion(correo.trim(), contrasena) : () => {}}
          style={{ opacity: puedeContinuar ? 1 : 0.45, marginBottom: espaciado.lg, marginTop: espaciado.sm }}
        />
        {cargando ? <ActivityIndicator color={colores.primarioFuerte} style={{ marginTop: -espaciado.md, marginBottom: espaciado.md }} /> : null}

        <Pressable onPress={onIrARegistro} style={styles.enlaceCentrado}>
          <Text style={styles.enlaceTexto}>
            ¿Todavía no tienes cuenta? <Text style={styles.enlaceTextoFuerte}>Crear una</Text>
          </Text>
        </Pressable>

        <View style={styles.divisorFila}>
          <View style={styles.divisorLinea} />
          <Text style={styles.divisorTexto}>o</Text>
          <View style={styles.divisorLinea} />
        </View>

        <BotonGoogle />

        <Pressable style={styles.saltar} onPress={onSaltar}>
          <Text style={styles.saltarTexto}>Continuar sin iniciar sesión (modo prueba)</Text>
        </Pressable>

        <Text style={styles.pieLegal}>
          Al continuar aceptas los <Text style={styles.pieLegalFuerte}>Términos</Text> y la{" "}
          <Text style={styles.pieLegalFuerte}>Política de Privacidad</Text> de {marca.nombreApp}.
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

function PantallaRegistro({ onVolver }: { onVolver: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const { comunidad } = useComunidadActiva();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const registrar = useSesion((estado) => estado.registrar);
  const cargando = useSesion((estado) => estado.cargando);
  const error = useSesion((estado) => estado.error);
  const limpiarError = useSesion((estado) => estado.limpiarError);

  const claveSegura = claveEsSegura(contrasena);
  const clavesCoinciden = confirmar.length > 0 && contrasena === confirmar;
  const puedeContinuar =
    nombre.trim().length > 0 &&
    apellido.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(correo) &&
    telefono.replace(/\D/g, "").length >= 9 &&
    claveSegura &&
    clavesCoinciden &&
    !cargando;

  function alConfirmar() {
    if (!puedeContinuar) return;
    registrar({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correo.trim(),
      telefono: telefono.replace(/\D/g, ""),
      comunidadId: comunidad?.id ?? "com-san-borja",
      contrasena,
    });
  }

  return (
    <View style={styles.pantalla}>
      <Pressable style={styles.volver} onPress={onVolver}>
        <Ionicons name="chevron-back" size={18} color={colores.textoSuave} />
        <Text style={styles.volverTexto}>Atrás</Text>
      </Pressable>

      <Text style={styles.tituloPaso}>Crea tu cuenta</Text>
      <Text style={styles.descPaso}>Así te reconocemos la próxima vez que abras la app.</Text>

      <View style={styles.filaDosCampos}>
        <View style={{ flex: 1 }}>
          <CampoTexto label="Nombre" placeholder="Ej. María" value={nombre} onChangeText={setNombre} />
        </View>
        <View style={{ flex: 1 }}>
          <CampoTexto label="Apellido" placeholder="Ej. Torres" value={apellido} onChangeText={setApellido} />
        </View>
      </View>

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

      <Text style={styles.campoLabel}>Número de celular</Text>
      <View style={styles.campoTelefono}>
        <View style={styles.prefijo}>
          <Text style={styles.bandera}>🇵🇪</Text>
          <Text style={styles.prefijoTexto}>+51</Text>
        </View>
        <TextInput
          style={styles.inputTelefono}
          placeholder="987 654 321"
          placeholderTextColor={colores.textoTenue}
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
          maxLength={12}
        />
      </View>

      <CampoClave label="Crea una contraseña" placeholder="Contraseña segura" valor={contrasena} onCambiar={setContrasena} />

      {contrasena.length > 0 ? (
        <View style={styles.listaReglas}>
          {REGLAS_CLAVE.map((regla) => {
            const cumple = regla.cumple(contrasena);
            return (
              <View key={regla.clave} style={styles.filaRegla}>
                <Ionicons
                  name={cumple ? "checkmark-circle" : "ellipse-outline"}
                  size={14}
                  color={cumple ? colores.exito : colores.textoTenue}
                />
                <Text style={[styles.textoRegla, cumple ? { color: colores.exito } : null]}>{regla.etiqueta}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <CampoClave label="Confirma tu contraseña" placeholder="Repite tu contraseña" valor={confirmar} onCambiar={setConfirmar} />
      {confirmar.length > 0 && !clavesCoinciden ? (
        <Text style={[styles.textoRegla, { color: colores.error, marginTop: -espaciado.sm, marginBottom: espaciado.sm }]}>
          Las contraseñas no coinciden.
        </Text>
      ) : null}

      {comunidad ? (
        <View style={styles.chipComunidad}>
          <Ionicons name="location" size={18} color={colores.acentoFuerte} />
          <View>
            <Text style={styles.chipComunidadTexto}>Detectamos tu zona:</Text>
            <Text style={styles.chipComunidadNombre}>{comunidad.nombre}</Text>
          </View>
        </View>
      ) : null}

      <MensajeError mensaje={error} />

      <BotonPrimario
        texto={cargando ? "Creando cuenta…" : "Crear cuenta"}
        onPress={alConfirmar}
        style={{ opacity: puedeContinuar ? 1 : 0.45, marginTop: espaciado.sm }}
      />
      {cargando ? <ActivityIndicator color={colores.primarioFuerte} style={{ marginTop: espaciado.md }} /> : null}
    </View>
  );
}

function PantallaOlvideClave({ onVolver, onEnviado }: { onVolver: () => void; onEnviado: (correo: string) => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [correo, setCorreo] = useState("");
  const olvideClave = useSesion((estado) => estado.olvideClave);
  const cargando = useSesion((estado) => estado.cargando);
  const error = useSesion((estado) => estado.error);
  const limpiarError = useSesion((estado) => estado.limpiarError);

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

      <Text style={styles.tituloPaso}>Recuperar contraseña</Text>
      <Text style={styles.descPaso}>Ingresa tu correo y te enviaremos un código para crear una contraseña nueva.</Text>

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

      <MensajeError mensaje={error} />

      <BotonPrimario
        texto={cargando ? "Enviando…" : "Enviar código"}
        onPress={alEnviar}
        style={{ opacity: puedeContinuar ? 1 : 0.45, marginTop: espaciado.sm }}
      />
      {cargando ? <ActivityIndicator color={colores.primarioFuerte} style={{ marginTop: espaciado.md }} /> : null}
    </View>
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
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [listo, setListo] = useState(false);

  const restablecerClave = useSesion((estado) => estado.restablecerClave);
  const cargando = useSesion((estado) => estado.cargando);
  const error = useSesion((estado) => estado.error);

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
          <Text style={[styles.tituloPaso, { textAlign: "center", fontSize: 20 }]}>Contraseña actualizada</Text>
          <Text style={[styles.descPaso, { textAlign: "center" }]}>Ya puedes iniciar sesión con tu contraseña nueva.</Text>
        </View>
        <BotonPrimario texto="Ir a iniciar sesión" onPress={onListo} />
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <Pressable style={styles.volver} onPress={onVolver}>
        <Ionicons name="chevron-back" size={18} color={colores.textoSuave} />
        <Text style={styles.volverTexto}>Atrás</Text>
      </Pressable>

      <Text style={styles.tituloPaso}>Ingresa el código</Text>
      <Text style={styles.descPaso}>
        Enviamos un código de 6 dígitos a <Text style={{ fontFamily: "PlusJakartaSans_700Bold", color: colores.texto }}>{correo}</Text>.
      </Text>

      <CampoTexto
        label="Código de 6 dígitos"
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={codigo}
        onChangeText={(v) => setCodigo(v.replace(/\D/g, "").slice(0, 6))}
      />

      <CampoClave label="Contraseña nueva" placeholder="Contraseña segura" valor={clave} onCambiar={setClave} />

      {clave.length > 0 ? (
        <View style={styles.listaReglas}>
          {REGLAS_CLAVE.map((regla) => {
            const cumple = regla.cumple(clave);
            return (
              <View key={regla.clave} style={styles.filaRegla}>
                <Ionicons
                  name={cumple ? "checkmark-circle" : "ellipse-outline"}
                  size={14}
                  color={cumple ? colores.exito : colores.textoTenue}
                />
                <Text style={[styles.textoRegla, cumple ? { color: colores.exito } : null]}>{regla.etiqueta}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <CampoClave label="Confirma la contraseña" placeholder="Repite tu contraseña" valor={confirmar} onCambiar={setConfirmar} />
      {confirmar.length > 0 && !clavesCoinciden ? (
        <Text style={[styles.textoRegla, { color: colores.error, marginTop: -espaciado.sm, marginBottom: espaciado.sm }]}>
          Las contraseñas no coinciden.
        </Text>
      ) : null}

      <MensajeError mensaje={error} />

      <BotonPrimario
        texto={cargando ? "Guardando…" : "Cambiar contraseña"}
        onPress={alConfirmar}
        style={{ opacity: puedeContinuar ? 1 : 0.45, marginTop: espaciado.sm }}
      />
      {cargando ? <ActivityIndicator color={colores.primarioFuerte} style={{ marginTop: espaciado.md }} /> : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    pantalla: {
      flex: 1,
      backgroundColor: colores.fondo,
      paddingHorizontal: espaciado.xl,
      paddingTop: espaciado.xxl,
      paddingBottom: espaciado.xl,
    },

    pantallaIngreso: {
      flex: 1,
      backgroundColor: colores.primario,
      overflow: "hidden",
    },
    scrollIngreso: {
      paddingHorizontal: espaciado.xl,
      paddingTop: espaciado.xxl,
      paddingBottom: espaciado.xl,
      flexGrow: 1,
    },
    circuloA: {
      position: "absolute",
      top: -60,
      right: -60,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: colores.primarioFuerte,
      opacity: 0.35,
    },
    circuloB: {
      position: "absolute",
      bottom: -90,
      left: -70,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: "#000",
      opacity: 0.12,
    },
    insignia: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: "rgba(255,255,255,0.16)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: espaciado.sm,
    },
    insigniaTexto: {
      ...tipografia.etiqueta,
      color: "rgba(255,255,255,0.75)",
      letterSpacing: 1,
      marginBottom: 6,
    },
    tituloIngreso: {
      ...tipografia.displayGrande,
      fontSize: 21,
      lineHeight: 28,
      color: "#fff",
      maxWidth: 260,
      marginBottom: espaciado.xl,
    },
    tarjetaIngreso: {
      backgroundColor: colores.fondo,
      borderRadius: radios.lg + 6,
      padding: espaciado.lg,
    },
    tarjetaTitulo: {
      ...tipografia.display,
      fontSize: 15,
      color: colores.primario,
      marginBottom: espaciado.md,
    },
    tituloPaso: {
      ...tipografia.displayGrande,
      color: colores.texto,
      marginBottom: espaciado.sm,
    },
    descPaso: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      marginBottom: espaciado.xl,
    },
    campoLabel: {
      ...tipografia.etiqueta,
      color: colores.textoSuave,
      marginBottom: espaciado.xs,
    },
    filaDosCampos: {
      flexDirection: "row",
      gap: espaciado.sm,
    },
    campoTelefono: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      borderWidth: 1.5,
      borderColor: colores.borde,
      borderRadius: radios.md,
      paddingHorizontal: espaciado.md,
      paddingVertical: espaciado.sm + 2,
      backgroundColor: colores.fondo,
      marginBottom: espaciado.md,
    },
    prefijo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingRight: espaciado.sm,
      borderRightWidth: 1,
      borderRightColor: colores.borde,
    },
    bandera: {
      fontSize: 16,
    },
    prefijoTexto: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
    },
    inputTelefono: {
      flex: 1,
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
    },
    divisorFila: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      marginBottom: espaciado.md,
    },
    divisorLinea: {
      flex: 1,
      height: 1,
      backgroundColor: colores.borde,
    },
    divisorTexto: {
      ...tipografia.pie,
      color: colores.textoTenue,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    botonSocial: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: espaciado.sm,
      borderWidth: 1.5,
      borderColor: colores.borde,
      borderRadius: radios.md,
      paddingVertical: espaciado.sm + 2,
      marginBottom: espaciado.md,
      opacity: 0.55,
    },
    botonSocialTexto: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
    },
    etiquetaProximamente: {
      ...tipografia.pie,
      fontSize: 10,
      color: colores.textoTenue,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    saltar: {
      alignItems: "center",
      paddingVertical: espaciado.sm,
      marginBottom: espaciado.md,
    },
    saltarTexto: {
      ...tipografia.pie,
      color: colores.acentoFuerte,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    pieLegal: {
      ...tipografia.pie,
      fontSize: 11,
      color: colores.textoTenue,
      textAlign: "center",
      marginTop: espaciado.sm,
    },
    pieLegalFuerte: {
      color: colores.textoSuave,
      fontFamily: "PlusJakartaSans_600SemiBold",
    },

    volver: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: espaciado.lg,
      alignSelf: "flex-start",
    },
    volverTexto: {
      ...tipografia.cuerpoDestacado,
      fontSize: 13,
      color: colores.textoSuave,
    },

    campoGenerico: {
      borderWidth: 1.5,
      borderColor: colores.borde,
      borderRadius: radios.md,
      paddingHorizontal: espaciado.md,
      paddingVertical: espaciado.sm + 2,
    },
    campoConIcono: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
    },
    inputGenerico: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
    },
    enlaceCentrado: {
      alignItems: "center",
      marginBottom: espaciado.lg,
    },
    enlaceTexto: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    enlaceTextoFuerte: {
      color: colores.acentoFuerte,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    cajaError: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.xs,
      backgroundColor: colores.acentoSuave,
      borderRadius: radios.md,
      paddingHorizontal: espaciado.md,
      paddingVertical: espaciado.sm,
      marginBottom: espaciado.md,
    },
    textoError: {
      ...tipografia.pie,
      color: colores.error,
      flex: 1,
    },
    listaReglas: {
      marginTop: -espaciado.sm,
      marginBottom: espaciado.md,
      gap: 4,
    },
    filaRegla: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    textoRegla: {
      ...tipografia.pie,
      fontSize: 11.5,
      color: colores.textoTenue,
    },
    chipComunidad: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.acentoSuave,
      borderRadius: radios.md,
      paddingHorizontal: espaciado.md,
      paddingVertical: espaciado.sm + 2,
      marginBottom: espaciado.lg,
    },
    chipComunidadTexto: {
      ...tipografia.pie,
      color: colores.acentoFuerte,
      fontFamily: "PlusJakartaSans_600SemiBold",
    },
    chipComunidadNombre: {
      ...tipografia.display,
      fontSize: 15,
      color: colores.texto,
    },
  });
}
