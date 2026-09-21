import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Categoria, Cuenta, DiaSemana, Horarios, Negocio, Producto, formatearPrecio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../disenio";
import { useTema } from "../../estado/useTema";
import { apiGet } from "../../datos/api/clienteApi";
import { useGestionNegocio } from "../../estado/useGestionNegocio";
import { Interruptor } from "../Interruptor";
import { IconoCategoria } from "../IconoCategoria";
import { elegirImagen } from "../../utilidades/elegirImagen";
import { urlCompleta } from "../../utilidades/media";
import { estadoVisualDe } from "../../utilidades/estadoNegocio";

const DIAS: { clave: DiaSemana; etiqueta: string }[] = [
  { clave: "lunes", etiqueta: "Lunes" },
  { clave: "martes", etiqueta: "Martes" },
  { clave: "miercoles", etiqueta: "Miércoles" },
  { clave: "jueves", etiqueta: "Jueves" },
  { clave: "viernes", etiqueta: "Viernes" },
  { clave: "sabado", etiqueta: "Sábado" },
  { clave: "domingo", etiqueta: "Domingo" },
];

function estadoNegocio(colores: PaletaColores, oscuro: boolean): Record<Negocio["estado"], { texto: string; color: string; fondo: string }> {
  return {
    activo: { texto: "Activo", color: colores.exito, fondo: colores.primarioSuave },
    por_verificar: { texto: "En revisión", color: oscuro ? "#e0b565" : "#b8862e", fondo: oscuro ? "#3a3018" : "#f6ecd6" },
    inactivo: { texto: "Inactivo", color: colores.textoTenue, fondo: colores.superficieHundida },
  };
}

type Tab = "info" | "horario" | "fotos" | "ofertas" | "estado";

const ETIQUETA_TAB: Record<Tab, string> = {
  info: "Información",
  horario: "Horario",
  fotos: "Fotos",
  ofertas: "Ofertas",
  estado: "Estado",
};

export function PantallaMiNegocio({ cuenta, token }: { cuenta: Cuenta; token: string }) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const oscuro = modo === "oscuro";
  const styles = crearEstilos(colores);
  const negocios = useGestionNegocio((estado) => estado.negocios);
  const cargando = useGestionNegocio((estado) => estado.cargando);
  const error = useGestionNegocio((estado) => estado.error);
  const cargarMios = useGestionNegocio((estado) => estado.cargarMios);
  const [negocioId, setNegocioId] = useState<string | null>(null);

  useEffect(() => {
    cargarMios(token);
  }, [cargarMios, token]);

  useEffect(() => {
    if (!negocioId && negocios.length === 1) setNegocioId(negocios[0].id);
  }, [negocios, negocioId]);

  if (cargando && negocios.length === 0) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colores.primarioFuerte} />
      </View>
    );
  }

  if (error && negocios.length === 0) {
    return (
      <View style={styles.centro}>
        <Text style={styles.textoError}>⚠️ {error}</Text>
      </View>
    );
  }

  const negocio = negocios.find((n) => n.id === negocioId);

  if (!negocio) {
    return (
      <ScrollView style={styles.pantalla} contentContainerStyle={{ padding: espaciado.lg }}>
        <Text style={styles.titulo}>Mis negocios</Text>
        <Text style={styles.subtitulo}>Elige cuál quieres administrar</Text>
        <View style={{ gap: espaciado.sm, marginTop: espaciado.md }}>
          {negocios.map((n) => {
            const estado = estadoNegocio(colores, oscuro)[n.estado];
            return (
              <Pressable key={n.id} style={styles.tarjetaNegocio} onPress={() => setNegocioId(n.id)}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.filaTitulo}>{n.nombre}</Text>
                  <Text style={styles.filaCuerpo}>{n.direccion}</Text>
                </View>
                <View style={[styles.pillEstado, { backgroundColor: estado.fondo }]}>
                  <Text style={[styles.pillEstadoTexto, { color: estado.color }]}>{estado.texto}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  return <EditorNegocio negocio={negocio} token={token} volverALista={negocios.length > 1 ? () => setNegocioId(null) : undefined} />;
}

function EditorNegocio({ negocio, token, volverALista }: { negocio: Negocio; token: string; volverALista?: () => void }) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores);
  const [tab, setTab] = useState<Tab>("info");
  const estado = estadoNegocio(colores, modo === "oscuro")[negocio.estado];

  return (
    <View style={styles.pantalla}>
      <View style={styles.cabecera}>
        {volverALista ? (
          <Pressable style={styles.volver} onPress={volverALista}>
            <Ionicons name="chevron-back" size={18} color={colores.textoSuave} />
            <Text style={styles.volverTexto}>Mis negocios</Text>
          </Pressable>
        ) : null}
        <Text style={styles.titulo}>{negocio.nombre}</Text>
        <View style={[styles.pillEstado, { backgroundColor: estado.fondo, alignSelf: "flex-start", marginTop: 4 }]}>
          <Text style={[styles.pillEstadoTexto, { color: estado.color }]}>{estado.texto}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {(["info", "horario", "fotos", "ofertas", "estado"] as Tab[]).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActivo]} onPress={() => setTab(t)}>
            <Text style={[styles.tabTexto, tab === t && styles.tabTextoActivo]}>{ETIQUETA_TAB[t]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === "info" ? <TabInformacion negocio={negocio} token={token} /> : null}
      {tab === "horario" ? <TabHorario negocio={negocio} token={token} /> : null}
      {tab === "fotos" ? <TabFotos negocio={negocio} token={token} /> : null}
      {tab === "ofertas" ? <TabOfertas negocio={negocio} token={token} /> : null}
      {tab === "estado" ? <TabEstado negocio={negocio} /> : null}
    </View>
  );
}

function TabInformacion({ negocio, token }: { negocio: Negocio; token: string }) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const oscuro = modo === "oscuro";
  const styles = crearEstilos(colores);
  const actualizarInfo = useGestionNegocio((estado) => estado.actualizarInfo);
  const cargando = useGestionNegocio((estado) => estado.cargando);
  const error = useGestionNegocio((estado) => estado.error);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState(negocio.nombre);
  const [descripcion, setDescripcion] = useState(negocio.descripcion);
  const [direccion, setDireccion] = useState(negocio.direccion);
  const [telefono, setTelefono] = useState(negocio.telefono ?? "");
  const [whatsapp, setWhatsapp] = useState(negocio.whatsapp ?? "");
  const [categoriaIds, setCategoriaIds] = useState<string[]>(negocio.categoriaIds);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    apiGet<Categoria[]>("/categorias").then(setCategorias).catch(() => {});
  }, []);

  const huboCambio =
    nombre !== negocio.nombre ||
    descripcion !== negocio.descripcion ||
    direccion !== negocio.direccion ||
    (telefono || null) !== negocio.telefono ||
    (whatsapp || null) !== negocio.whatsapp ||
    categoriaIds.sort().join(",") !== [...negocio.categoriaIds].sort().join(",");

  function alternarCategoria(id: string) {
    setCategoriaIds((actual) => (actual.includes(id) ? actual.filter((c) => c !== id) : [...actual, id]));
  }

  async function guardar() {
    const ok = await actualizarInfo(negocio.id, { nombre: nombre.trim(), descripcion: descripcion.trim(), categoriaIds, direccion: direccion.trim(), telefono: telefono.trim() || null, whatsapp: whatsapp.trim() || null }, token);
    if (ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    }
  }

  return (
    <ScrollView style={styles.contenidoTab} contentContainerStyle={{ paddingBottom: espaciado.xxl }}>
      <View style={[styles.cajaNota, styles.cajaNotaEspera]}>
        <Text style={[styles.textoNota, { color: oscuro ? "#e0b565" : "#b8862e" }]}>
          Los cambios se guardan directo y se ven en la app de inmediato.
        </Text>
      </View>

      <Text style={styles.label}>Nombre del negocio</Text>
      <View style={styles.campo}>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholderTextColor={colores.textoTenue} />
      </View>

      <Text style={[styles.label, { marginTop: espaciado.md }]}>Descripción</Text>
      <View style={styles.campo}>
        <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]} value={descripcion} onChangeText={setDescripcion} multiline placeholderTextColor={colores.textoTenue} />
      </View>

      <Text style={[styles.label, { marginTop: espaciado.md }]}>Categoría</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: espaciado.xs }}>
        {categorias.filter((c) => !c.padreId).map((c) => {
          const seleccionado = categoriaIds.includes(c.id);
          return (
            <Pressable key={c.id} style={[styles.chip, seleccionado && styles.chipSel, { flexDirection: "row", alignItems: "center", gap: 5 }]} onPress={() => alternarCategoria(c.id)}>
              <IconoCategoria nombre={c.icono} size={13} color={seleccionado ? colores.primarioFuerte : colores.textoSuave} />
              <Text style={[styles.chipTexto, seleccionado && styles.chipTextoSel]}>{c.nombre}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: espaciado.md }]}>Dirección</Text>
      <View style={styles.campo}>
        <TextInput style={styles.input} value={direccion} onChangeText={setDireccion} placeholderTextColor={colores.textoTenue} />
      </View>

      <View style={{ flexDirection: "row", gap: espaciado.sm, marginTop: espaciado.md }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Teléfono</Text>
          <View style={styles.campo}>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" placeholder="Opcional" placeholderTextColor={colores.textoTenue} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>WhatsApp</Text>
          <View style={styles.campo}>
            <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="Opcional" placeholderTextColor={colores.textoTenue} />
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.cajaAlerta}>
          <Text style={styles.textoAlerta}>⚠️ {error}</Text>
        </View>
      ) : null}
      {guardado ? (
        <View style={[styles.cajaNota, styles.cajaNotaExito, { marginTop: espaciado.md }]}>
          <Text style={[styles.textoNota, { color: colores.primarioFuerte }]}>✓ Guardado.</Text>
        </View>
      ) : null}

      <Pressable style={[styles.boton, { opacity: huboCambio && !cargando ? 1 : 0.45, marginTop: espaciado.lg }]} onPress={huboCambio ? guardar : undefined}>
        <Text style={styles.botonTexto}>{cargando ? "Guardando…" : "Guardar cambios"}</Text>
      </Pressable>
    </ScrollView>
  );
}

function TabHorario({ negocio, token }: { negocio: Negocio; token: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const actualizarHorarios = useGestionNegocio((estado) => estado.actualizarHorarios);
  const cargando = useGestionNegocio((estado) => estado.cargando);
  const error = useGestionNegocio((estado) => estado.error);
  const [horarios, setHorarios] = useState<Horarios>(negocio.horarios);
  const [guardado, setGuardado] = useState(false);

  const huboCambio = JSON.stringify(horarios) !== JSON.stringify(negocio.horarios);

  function actualizarDia(dia: DiaSemana, cambios: Partial<Horarios[DiaSemana]>) {
    setHorarios((actual) => ({ ...actual, [dia]: { ...actual[dia], ...cambios } }));
  }

  async function guardar() {
    const ok = await actualizarHorarios(negocio.id, horarios, token);
    if (ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    }
  }

  return (
    <ScrollView style={styles.contenidoTab} contentContainerStyle={{ paddingBottom: espaciado.xxl }}>
      <Text style={styles.subtitulo}>Activa o desactiva cada día y define su horario.</Text>
      {DIAS.map(({ clave, etiqueta }) => {
        const dia = horarios[clave];
        const abierto = !dia.cerrado;
        return (
          <View key={clave} style={styles.filaDia}>
            <Interruptor activo={abierto} onCambiar={(v) => actualizarDia(clave, v ? { cerrado: false, abre: dia.abre ?? "09:00", cierra: dia.cierra ?? "20:00" } : { cerrado: true })} />
            <Text style={styles.diaEtiqueta}>{etiqueta}</Text>
            {abierto ? (
              <View style={styles.horasFila}>
                <TextInput
                  style={styles.inputHora}
                  value={dia.abre}
                  onChangeText={(v) => actualizarDia(clave, { abre: v })}
                  placeholder="09:00"
                  placeholderTextColor={colores.textoTenue}
                />
                <Text style={{ color: colores.textoTenue }}>–</Text>
                <TextInput
                  style={styles.inputHora}
                  value={dia.cierra}
                  onChangeText={(v) => actualizarDia(clave, { cierra: v })}
                  placeholder="20:00"
                  placeholderTextColor={colores.textoTenue}
                />
              </View>
            ) : (
              <Text style={styles.cerradoTexto}>Cerrado todo el día</Text>
            )}
          </View>
        );
      })}

      {error ? (
        <View style={styles.cajaAlerta}>
          <Text style={styles.textoAlerta}>⚠️ {error}</Text>
        </View>
      ) : null}
      {guardado ? (
        <View style={[styles.cajaNota, styles.cajaNotaExito, { marginTop: espaciado.md }]}>
          <Text style={[styles.textoNota, { color: colores.primarioFuerte }]}>✓ Horario guardado.</Text>
        </View>
      ) : null}

      <Pressable style={[styles.boton, { opacity: huboCambio && !cargando ? 1 : 0.45, marginTop: espaciado.lg }]} onPress={huboCambio ? guardar : undefined}>
        <Text style={styles.botonTexto}>{cargando ? "Guardando…" : "Guardar horario"}</Text>
      </Pressable>
    </ScrollView>
  );
}

function TabOfertas({ negocio, token }: { negocio: Negocio; token: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const agregarOferta = useGestionNegocio((estado) => estado.agregarOferta);
  const eliminarOferta = useGestionNegocio((estado) => estado.eliminarOferta);
  const cargando = useGestionNegocio((estado) => estado.cargando);
  const error = useGestionNegocio((estado) => estado.error);
  const [nombreOferta, setNombreOferta] = useState("");
  const [precio, setPrecio] = useState("");
  const [precioOriginal, setPrecioOriginal] = useState("");
  const [etiqueta, setEtiqueta] = useState("");

  const ofertas = negocio.ofertas ?? [];
  const puedeAgregar = nombreOferta.trim() && Number(precio) > 0 && etiqueta.trim();

  async function agregar() {
    if (!puedeAgregar) return;
    const ok = await agregarOferta(
      negocio.id,
      {
        nombre: nombreOferta.trim(),
        precio: Number(precio),
        ...(precioOriginal ? { precioOriginal: Number(precioOriginal) } : {}),
        etiqueta: etiqueta.trim(),
      },
      token,
    );
    if (ok) {
      setNombreOferta("");
      setPrecio("");
      setPrecioOriginal("");
      setEtiqueta("");
    }
  }

  return (
    <ScrollView style={styles.contenidoTab} contentContainerStyle={{ paddingBottom: espaciado.xxl }}>
      {ofertas.length === 0 ? (
        <Text style={styles.subtitulo}>Todavía no tienes ofertas activas.</Text>
      ) : (
        <View style={{ gap: espaciado.sm, marginBottom: espaciado.lg }}>
          {ofertas.map((oferta, indice) => (
            <View key={`${oferta.nombre}-${indice}`} style={styles.filaOferta}>
              <View style={{ flex: 1 }}>
                <Text style={styles.filaTitulo}>{oferta.etiqueta} · {oferta.nombre}</Text>
                <Text style={styles.filaCuerpo}>
                  {oferta.precioOriginal ? `${formatearPrecio(oferta.precioOriginal, negocio.moneda)} → ` : ""}
                  {formatearPrecio(oferta.precio, negocio.moneda)}
                </Text>
              </View>
              <Pressable onPress={() => eliminarOferta(negocio.id, indice, token)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colores.error} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.label}>Nombre de la oferta</Text>
      <View style={styles.campo}>
        <TextInput style={styles.input} value={nombreOferta} onChangeText={setNombreOferta} placeholder="Ej. Parrilla familiar" placeholderTextColor={colores.textoTenue} />
      </View>

      <View style={{ flexDirection: "row", gap: espaciado.sm, marginTop: espaciado.md }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Precio</Text>
          <View style={styles.campo}>
            <TextInput style={styles.input} value={precio} onChangeText={setPrecio} keyboardType="numeric" placeholder="Ej. 32" placeholderTextColor={colores.textoTenue} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Precio anterior (opcional)</Text>
          <View style={styles.campo}>
            <TextInput style={styles.input} value={precioOriginal} onChangeText={setPrecioOriginal} keyboardType="numeric" placeholder="Ej. 38" placeholderTextColor={colores.textoTenue} />
          </View>
        </View>
      </View>

      <Text style={[styles.label, { marginTop: espaciado.md }]}>Etiqueta corta</Text>
      <View style={styles.campo}>
        <TextInput style={styles.input} value={etiqueta} onChangeText={setEtiqueta} placeholder="Ej. -20%, Martes, Solo hoy" placeholderTextColor={colores.textoTenue} />
      </View>

      {error ? (
        <View style={styles.cajaAlerta}>
          <Text style={styles.textoAlerta}>⚠️ {error}</Text>
        </View>
      ) : null}

      <Pressable style={[styles.boton, { opacity: puedeAgregar && !cargando ? 1 : 0.45, marginTop: espaciado.lg }]} onPress={agregar}>
        <Text style={styles.botonTexto}>{cargando ? "Agregando…" : "+ Agregar oferta"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const MAX_FOTOS_GALERIA = 6;

function TabFotos({ negocio, token }: { negocio: Negocio; token: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const subirFoto = useGestionNegocio((estado) => estado.subirFoto);
  const agregarFotoGaleria = useGestionNegocio((estado) => estado.agregarFotoGaleria);
  const eliminarFotoGaleria = useGestionNegocio((estado) => estado.eliminarFotoGaleria);
  const subirFotoProducto = useGestionNegocio((estado) => estado.subirFotoProducto);
  const error = useGestionNegocio((estado) => estado.error);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [subiendoPrincipal, setSubiendoPrincipal] = useState(false);
  const [subiendoGaleria, setSubiendoGaleria] = useState(false);
  const [subiendoProductoId, setSubiendoProductoId] = useState<string | null>(null);
  const [borrandoUrl, setBorrandoUrl] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Producto[]>(`/negocios/${negocio.id}/productos`).then(setProductos).catch(() => setProductos([]));
  }, [negocio.id]);

  async function alSubirPrincipal() {
    const imagen = await elegirImagen();
    if (!imagen) return;
    setSubiendoPrincipal(true);
    await subirFoto(negocio.id, imagen, token);
    setSubiendoPrincipal(false);
  }

  async function alSubirProducto(producto: Producto) {
    const imagen = await elegirImagen();
    if (!imagen) return;
    setSubiendoProductoId(producto.id);
    const actualizado = await subirFotoProducto(negocio.id, producto.id, imagen, token);
    if (actualizado) setProductos((actual) => actual.map((p) => (p.id === producto.id ? actualizado : p)));
    setSubiendoProductoId(null);
  }

  async function alAgregarGaleria() {
    const imagen = await elegirImagen();
    if (!imagen) return;
    setSubiendoGaleria(true);
    await agregarFotoGaleria(negocio.id, imagen, token);
    setSubiendoGaleria(false);
  }

  async function alBorrarGaleria(url: string) {
    setBorrandoUrl(url);
    await eliminarFotoGaleria(negocio.id, url, token);
    setBorrandoUrl(null);
  }

  const fotosGaleria = negocio.fotosGaleria ?? [];

  return (
    <ScrollView style={styles.contenidoTab} contentContainerStyle={{ paddingBottom: espaciado.xxl }}>
      <Text style={styles.label}>Foto principal</Text>
      <Pressable
        style={[styles.slotFotoPrincipal, negocio.fotoPrincipalUrl ? undefined : styles.slotFotoVacio]}
        onPress={alSubirPrincipal}
        disabled={subiendoPrincipal}
      >
        {negocio.fotoPrincipalUrl ? (
          <Image source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.imagenPrincipal} />
        ) : (
          <Ionicons name="image-outline" size={28} color={colores.textoTenue} />
        )}
        <View style={styles.capaSubir}>
          {subiendoPrincipal ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoCapaSubir}>{negocio.fotoPrincipalUrl ? "Cambiar foto" : "Subir foto"}</Text>
          )}
        </View>
      </Pressable>
      <Text style={styles.notaFoto}>
        Mientras no subas ninguna foto, tu ficha muestra un espacio neutro — nunca fotos inventadas de tu negocio.
        Formatos: JPG, PNG o WEBP, hasta 5MB.
      </Text>

      {productos.length > 0 ? (
        <>
          <Text style={[styles.label, { marginTop: espaciado.lg }]}>Fotos de tu menú / catálogo</Text>
          <View style={{ gap: espaciado.sm }}>
            {productos.map((producto) => (
              <View key={producto.id} style={styles.filaOferta}>
                <View style={styles.miniFotoProducto}>
                  {producto.fotoUrl ? (
                    <Image source={{ uri: urlCompleta(producto.fotoUrl) }} style={styles.imagenMiniProducto} />
                  ) : (
                    <Ionicons name="image-outline" size={16} color={colores.textoTenue} />
                  )}
                </View>
                <Text style={[styles.filaTitulo, { flex: 1 }]} numberOfLines={1}>
                  {producto.nombre}
                </Text>
                <Pressable
                  style={styles.botonMini}
                  onPress={() => alSubirProducto(producto)}
                  disabled={subiendoProductoId === producto.id}
                >
                  <Text style={styles.botonMiniTexto}>
                    {subiendoProductoId === producto.id ? "Subiendo…" : producto.fotoUrl ? "Cambiar" : "Subir foto"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={[styles.label, { marginTop: espaciado.lg }]}>Galería del negocio</Text>
      <Text style={styles.notaFoto}>
        Solo se muestra en tu ficha si no tienes menú, catálogo ni servicios cargados — hasta {MAX_FOTOS_GALERIA}{" "}
        fotos (fachada, interior, lo que ofreces, etc.).
      </Text>
      <View style={styles.gridGaleria}>
        {fotosGaleria.map((url) => (
          <View key={url} style={styles.slotGaleria}>
            <Image source={{ uri: urlCompleta(url) }} style={styles.imagenGaleria} />
            <Pressable style={styles.botonBorrarGaleria} onPress={() => alBorrarGaleria(url)} disabled={borrandoUrl === url} hitSlop={6}>
              <Ionicons name="trash-outline" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        {fotosGaleria.length < MAX_FOTOS_GALERIA ? (
          <Pressable style={styles.slotGaleriaAgregar} onPress={alAgregarGaleria} disabled={subiendoGaleria}>
            {subiendoGaleria ? (
              <ActivityIndicator color={colores.textoTenue} />
            ) : (
              <>
                <Ionicons name="add" size={20} color={colores.textoSuave} />
                <Text style={styles.textoAgregarGaleria}>Agregar</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.cajaAlerta}>
          <Text style={styles.textoAlerta}>⚠️ {error}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const ETIQUETA_ESTADO_VISUAL = { activo: "Activo", pendiente: "Pendiente", rechazado: "Rechazado" } as const;

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  const partes = new Date(fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  return partes;
}

function TabEstado({ negocio }: { negocio: Negocio }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const estadoVisual = estadoVisualDe(negocio);

  const tarjeta =
    estadoVisual === "rechazado"
      ? {
          icono: "close-circle" as const,
          color: colores.error,
          fondo: colores.acentoSuave,
          titulo: "Tu último envío fue rechazado",
          texto: 'Corrige lo que se indica abajo y vuelve a enviarlo desde "Información" — no hace falta escribirnos.',
        }
      : estadoVisual === "activo"
        ? {
            icono: "checkmark-circle" as const,
            color: colores.exito,
            fondo: colores.primarioSuave,
            titulo: "Tu negocio está activo y visible",
            texto: `Los vecinos pueden verte en Buscar y en la ficha${negocio.verificadoEn ? ` desde el ${formatearFecha(negocio.verificadoEn)}` : ""}.`,
          }
        : {
            icono: "time" as const,
            color: "#b8862e",
            fondo: "#f6ecd6",
            titulo: "Tu negocio está en revisión",
            texto: "El equipo ELISUR está validando tu información. Te avisaremos apenas quede aprobado o si hay algo que corregir.",
          };

  return (
    <ScrollView style={styles.contenidoTab} contentContainerStyle={{ paddingBottom: espaciado.xxl }}>
      <View style={[styles.tarjetaEstadoGrande, { backgroundColor: tarjeta.fondo }]}>
        <Ionicons name={tarjeta.icono} size={26} color={tarjeta.color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.filaTitulo, { color: tarjeta.color }]}>{tarjeta.titulo}</Text>
          <Text style={[styles.filaCuerpo, { marginTop: 2 }]}>{tarjeta.texto}</Text>
        </View>
      </View>

      <Text style={[styles.label, { marginTop: espaciado.lg, marginBottom: espaciado.sm }]}>Línea de tiempo</Text>

      <View style={styles.pasoTiempo}>
        <View style={[styles.puntoTiempo, { backgroundColor: colores.primarioSuave }]}>
          <Ionicons name="checkmark" size={12} color={colores.primarioFuerte} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.filaTitulo}>Enviado a validación</Text>
          <Text style={styles.filaCuerpo}>{formatearFecha(negocio.creadoEn)}</Text>
        </View>
      </View>

      {estadoVisual === "rechazado" ? (
        <View style={styles.pasoTiempo}>
          <View style={[styles.puntoTiempo, { backgroundColor: colores.acentoSuave }]}>
            <Ionicons name="close" size={12} color={colores.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.filaTitulo}>Rechazado por el equipo ELISUR</Text>
            <Text style={styles.filaCuerpo}>{formatearFecha(negocio.actualizadoEn)}</Text>
            {negocio.motivoRechazo ? <Text style={styles.cajaMotivoRechazo}>"{negocio.motivoRechazo}"</Text> : null}
          </View>
        </View>
      ) : estadoVisual === "activo" ? (
        <>
          <View style={styles.pasoTiempo}>
            <View style={[styles.puntoTiempo, { backgroundColor: colores.primarioSuave }]}>
              <Ionicons name="checkmark" size={12} color={colores.primarioFuerte} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.filaTitulo}>Aprobado por el equipo ELISUR</Text>
              <Text style={styles.filaCuerpo}>{formatearFecha(negocio.verificadoEn)}</Text>
            </View>
          </View>
          <View style={styles.pasoTiempo}>
            <View style={[styles.puntoTiempo, { backgroundColor: colores.primarioSuave }]}>
              <Ionicons name="eye" size={12} color={colores.primarioFuerte} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.filaTitulo}>Visible para los vecinos</Text>
              <Text style={styles.filaCuerpo}>Desde entonces</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.pasoTiempo}>
          <View style={[styles.puntoTiempo, { backgroundColor: "#f6ecd6" }]}>
            <Ionicons name="time" size={12} color="#b8862e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.filaTitulo}>En revisión</Text>
            <Text style={styles.filaCuerpo}>El equipo ELISUR lo está evaluando</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.superficieHundida },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: espaciado.xl },
    textoError: { ...tipografia.cuerpo, color: colores.error, textAlign: "center" },

    cabecera: { padding: espaciado.lg, paddingBottom: espaciado.md },
    volver: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: espaciado.sm },
    volverTexto: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.textoSuave },
    titulo: { ...tipografia.displayGrande, fontSize: 20, color: colores.texto },
    subtitulo: { ...tipografia.cuerpo, color: colores.textoSuave, marginBottom: espaciado.md },

    // Sin esto, el ScrollView horizontal de pestañas se estira como flex:1 en React Native
    // Web (sin `style` propio, RNW le aplica flexGrow por defecto) y se come el espacio del
    // contenido de abajo, dejando un hueco vacío enorme antes de que empiece cada pestaña.
    tabsScroll: { flexGrow: 0, flexShrink: 0 },
    tabs: { flexDirection: "row", gap: espaciado.xs, paddingHorizontal: espaciado.lg, marginBottom: espaciado.sm },
    tab: { paddingVertical: espaciado.xs, paddingHorizontal: espaciado.sm },
    tabActivo: { borderBottomWidth: 2, borderBottomColor: colores.primario },
    tabTexto: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.textoTenue },
    tabTextoActivo: { color: colores.texto },

    contenidoTab: { flex: 1, paddingHorizontal: espaciado.lg, paddingTop: espaciado.sm },

    tarjetaNegocio: { flexDirection: "row", alignItems: "center", gap: espaciado.md, backgroundColor: colores.superficie, borderRadius: radios.lg, padding: espaciado.md },
    filaTitulo: { ...tipografia.cuerpoDestacado, color: colores.texto },
    filaCuerpo: { ...tipografia.pie, color: colores.textoSuave },
    pillEstado: { paddingHorizontal: espaciado.sm, paddingVertical: 4, borderRadius: radios.completo },
    pillEstadoTexto: { ...tipografia.pie, fontSize: 10.5, fontFamily: "PlusJakartaSans_700Bold" },

    cajaNota: { borderRadius: radios.md, padding: espaciado.md, marginBottom: espaciado.md },
    cajaNotaExito: { backgroundColor: colores.primarioSuave },
    cajaNotaEspera: { backgroundColor: colores.acentoSuave },
    textoNota: { ...tipografia.pie, lineHeight: 17 },

    label: { ...tipografia.etiqueta, color: colores.textoSuave, marginBottom: espaciado.xs },
    campo: { borderWidth: 1.5, borderColor: colores.borde, borderRadius: radios.md, paddingHorizontal: espaciado.md, paddingVertical: espaciado.sm + 2, backgroundColor: colores.superficie },
    input: { ...tipografia.cuerpoDestacado, color: colores.texto },

    chip: { borderWidth: 1.5, borderColor: colores.borde, borderRadius: radios.completo, paddingHorizontal: espaciado.sm + 2, paddingVertical: espaciado.xs, backgroundColor: colores.superficie },
    chipSel: { borderColor: colores.primario, backgroundColor: colores.primarioSuave },
    chipTexto: { ...tipografia.pie, fontSize: 12, color: colores.textoSuave },
    chipTextoSel: { color: colores.primarioFuerte, fontFamily: "PlusJakartaSans_700Bold" },

    filaDia: { flexDirection: "row", alignItems: "center", gap: espaciado.sm, paddingVertical: espaciado.sm + 2, borderBottomWidth: 1, borderBottomColor: colores.borde },
    diaEtiqueta: { ...tipografia.cuerpoDestacado, color: colores.texto, width: 76 },
    horasFila: { flexDirection: "row", alignItems: "center", gap: espaciado.xs, flex: 1, justifyContent: "flex-end" },
    inputHora: { ...tipografia.cuerpo, color: colores.texto, borderWidth: 1, borderColor: colores.borde, borderRadius: radios.sm, paddingHorizontal: espaciado.sm, paddingVertical: 4, width: 64, textAlign: "center" },
    cerradoTexto: { ...tipografia.pie, color: colores.textoTenue, fontStyle: "italic", flex: 1, textAlign: "right" },

    filaOferta: { flexDirection: "row", alignItems: "center", gap: espaciado.md, backgroundColor: colores.superficie, borderRadius: radios.md, padding: espaciado.md },

    boton: { height: 46, borderRadius: radios.md, alignItems: "center", justifyContent: "center", backgroundColor: colores.texto },
    botonTexto: { ...tipografia.cuerpoDestacado, color: "#fff" },

    cajaAlerta: { backgroundColor: colores.acentoSuave, borderRadius: radios.md, padding: espaciado.sm + 2, marginTop: espaciado.md },
    textoAlerta: { ...tipografia.pie, color: colores.error },

    slotFotoPrincipal: { width: 140, height: 140, borderRadius: radios.lg, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colores.superficie },
    slotFotoVacio: { borderWidth: 1.5, borderColor: colores.borde, borderStyle: "dashed" },
    imagenPrincipal: { width: "100%", height: "100%" },
    capaSubir: { position: "absolute", left: 0, right: 0, bottom: 0, paddingVertical: espaciado.xs, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center" },
    textoCapaSubir: { ...tipografia.pie, fontSize: 11.5, color: "#fff", fontFamily: "PlusJakartaSans_700Bold" },
    notaFoto: { ...tipografia.pie, color: colores.textoSuave, lineHeight: 17, marginTop: espaciado.sm },

    miniFotoProducto: { width: 36, height: 36, borderRadius: radios.sm, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colores.superficieHundida },
    imagenMiniProducto: { width: "100%", height: "100%" },
    botonMini: { paddingHorizontal: espaciado.sm, paddingVertical: 6, borderRadius: radios.sm, backgroundColor: colores.superficieHundida },
    botonMiniTexto: { ...tipografia.pie, fontSize: 11, color: colores.textoSuave, fontFamily: "PlusJakartaSans_700Bold" },

    gridGaleria: { flexDirection: "row", flexWrap: "wrap", gap: espaciado.sm },
    slotGaleria: { width: 84, height: 84, borderRadius: radios.md, overflow: "hidden", backgroundColor: colores.superficie },
    imagenGaleria: { width: "100%", height: "100%" },
    botonBorrarGaleria: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: radios.completo, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
    slotGaleriaAgregar: { width: 84, height: 84, borderRadius: radios.md, borderWidth: 1.5, borderColor: colores.borde, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 2 },
    textoAgregarGaleria: { ...tipografia.pie, fontSize: 10.5, color: colores.textoSuave },

    tarjetaEstadoGrande: { flexDirection: "row", alignItems: "flex-start", gap: espaciado.sm, borderRadius: radios.lg, padding: espaciado.md },
    pasoTiempo: { flexDirection: "row", alignItems: "flex-start", gap: espaciado.sm, paddingVertical: espaciado.sm },
    puntoTiempo: { width: 24, height: 24, borderRadius: radios.completo, alignItems: "center", justifyContent: "center" },
    cajaMotivoRechazo: { ...tipografia.pie, color: colores.textoSuave, fontStyle: "italic", backgroundColor: colores.superficieHundida, borderRadius: radios.sm, padding: espaciado.sm, marginTop: espaciado.xs },
  });
}
