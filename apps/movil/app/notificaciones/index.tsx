import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { useTema } from "../../src/estado/useTema";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useAvisos } from "../../src/datos/hooks/useAvisos";
import { useNegocios } from "../../src/datos/hooks/useNegocios";
import { useNovedades } from "../../src/datos/hooks/useNovedades";
import { useNotificaciones } from "../../src/estado/useNotificaciones";
import { useNotificacionesLeidas } from "../../src/estado/useNotificacionesLeidas";
import { obtenerCategoriasNotificacion } from "../../src/config/categoriasNotificacion";
import { TarjetaNotificacion } from "../../src/componentes/TarjetaNotificacion";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";
import { recolectarOfertas } from "../../src/utilidades/ofertas";
import { tiempoRelativo } from "../../src/utilidades/tiempoRelativo";

export default function Notificaciones() {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores);
  const categoriaPorId = Object.fromEntries(
    obtenerCategoriasNotificacion(colores, modo === "oscuro").map((c) => [c.id, c])
  );
  const { comunidad } = useComunidadActiva();
  const preferencias = useNotificaciones((estado) => estado.preferencias);
  const { data: avisos } = useAvisos(comunidad?.id);
  const { data: negocios } = useNegocios({ comunidadId: comunidad?.id ?? "", limite: 30 });
  const { data: novedadesData } = useNovedades();
  const leidas = useNotificacionesLeidas((estado) => estado.leidas);
  const marcarLeida = useNotificacionesLeidas((estado) => estado.marcarLeida);

  const avisosSeguridad = preferencias.seguridad
    ? (avisos ?? []).filter((a) => a.categoria === "seguridad")
    : [];
  const avisosComunidad = preferencias.avisos_municipales
    ? (avisos ?? []).filter((a) => a.categoria !== "seguridad")
    : [];
  const ofertas = preferencias.ofertas ? recolectarOfertas(negocios?.items ?? []) : [];
  const novedades = preferencias.novedades ? novedadesData ?? [] : [];

  const hayContenido =
    avisosSeguridad.length > 0 || avisosComunidad.length > 0 || ofertas.length > 0 || novedades.length > 0;

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido}>
      {!hayContenido ? (
        <EstadoVacio titulo="No tienes notificaciones activas. Revisa tus preferencias en el ícono de ajustes." />
      ) : (
        <>
          {avisosSeguridad.length > 0 ? (
            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Alertas activas</Text>
              {avisosSeguridad.map((aviso) => (
                <TarjetaNotificacion
                  key={aviso.id}
                  categoria={categoriaPorId.seguridad}
                  titulo={aviso.titulo}
                  texto={aviso.cuerpo}
                  tiempo={tiempoRelativo(aviso.publicadoEn)}
                  leida={leidas.has(aviso.id)}
                  onPress={() => {
                    marcarLeida(aviso.id);
                    router.push("/comunidad");
                  }}
                />
              ))}
            </View>
          ) : null}

          {avisosComunidad.length > 0 ? (
            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Avisos de la comunidad</Text>
              {avisosComunidad.map((aviso) => (
                <TarjetaNotificacion
                  key={aviso.id}
                  categoria={categoriaPorId.avisos_municipales}
                  titulo={aviso.titulo}
                  texto={aviso.cuerpo}
                  tiempo={tiempoRelativo(aviso.publicadoEn)}
                  leida={leidas.has(aviso.id)}
                  onPress={() => {
                    marcarLeida(aviso.id);
                    router.push("/comunidad");
                  }}
                />
              ))}
            </View>
          ) : null}

          {ofertas.length > 0 ? (
            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Ofertas de negocios</Text>
              {ofertas.map(({ negocioId, negocioNombre, oferta }) => {
                const id = `${negocioId}-${oferta.nombre}`;
                return (
                  <TarjetaNotificacion
                    key={id}
                    categoria={categoriaPorId.ofertas}
                    titulo={`${oferta.etiqueta} en ${oferta.nombre}`}
                    texto={`${negocioNombre} tiene una oferta activa cerca de ti.`}
                    leida={leidas.has(id)}
                    onPress={() => {
                      marcarLeida(id);
                      router.push(`/negocio/${negocioId}`);
                    }}
                  />
                );
              })}
            </View>
          ) : null}

          {novedades.length > 0 ? (
            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Novedades</Text>
              {novedades.map((novedad) => (
                <TarjetaNotificacion
                  key={novedad.id}
                  categoria={categoriaPorId.novedades}
                  titulo={novedad.titulo}
                  texto={novedad.texto}
                  leida={leidas.has(novedad.id)}
                  onPress={() => marcarLeida(novedad.id)}
                />
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.superficieHundida,
    },
    contenido: {
      padding: espaciado.lg,
      gap: espaciado.lg,
    },
    seccion: {
      gap: espaciado.sm,
    },
    tituloSeccion: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
    },
  });
}
