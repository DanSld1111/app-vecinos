import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Aviso } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../src/disenio";
import { useTema } from "../../src/estado/useTema";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useAvisos } from "../../src/datos/hooks/useAvisos";
import { ChipCategoria } from "../../src/componentes/ChipCategoria";
import { TarjetaAviso } from "../../src/componentes/TarjetaAviso";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";
import { EstadoError } from "../../src/componentes/EstadoError";
import { EsqueletoListaAvisos } from "../../src/componentes/EsqueletoAviso";
import { agruparPorFecha } from "../../src/utilidades/agruparAvisos";

type FiltroComunidad = "todo" | "municipal" | "junta_vecinal" | "seguridad" | "perdidos";

function filtros(colores: PaletaColores): { id: FiltroComunidad; etiqueta: string; colorPunto?: string }[] {
  return [
    { id: "todo", etiqueta: "Todo", colorPunto: colores.textoTenue },
    { id: "municipal", etiqueta: "Municipal", colorPunto: colores.primario },
    { id: "junta_vecinal", etiqueta: "Junta vecinal", colorPunto: "#b8862e" },
    { id: "seguridad", etiqueta: "Seguridad", colorPunto: colores.error },
    { id: "perdidos", etiqueta: "Perdidos", colorPunto: colores.textoTenue },
  ];
}

function filtrarAvisos(avisos: Aviso[], filtro: FiltroComunidad): Aviso[] {
  if (filtro === "todo") return avisos;
  if (filtro === "perdidos") return [];
  return avisos.filter((a) => a.categoria === filtro);
}

export default function Comunidad() {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores, modo === "oscuro");
  const { comunidad } = useComunidadActiva();
  const [filtro, setFiltro] = useState<FiltroComunidad>("todo");
  const { data: avisos, isLoading, isError, isRefetching, refetch } = useAvisos(comunidad?.id);

  const avisosFiltrados = filtrarAvisos(avisos ?? [], filtro);

  // Las alertas de seguridad se fijan arriba del feed mientras estén vigentes, sin importar la fecha.
  const mostrarFijadas = filtro === "todo";
  const fijadas = mostrarFijadas ? avisosFiltrados.filter((a) => a.categoria === "seguridad") : [];
  const resto = mostrarFijadas
    ? avisosFiltrados.filter((a) => a.categoria !== "seguridad")
    : avisosFiltrados;
  const grupos = agruparPorFecha(resto);

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colores.primario} />
      }
    >
      <View style={styles.filaTitulo}>
        <Text style={styles.titulo}>Comunidad</Text>
        <View style={styles.insigniaZona}>
          <Text style={styles.insigniaZonaTexto}>{comunidad?.nombre ?? "..."}</Text>
        </View>
      </View>
      <Text style={styles.subtitulo}>Lo que está pasando cerca de ti, en tiempo real.</Text>

      <View style={styles.filaChips}>
        {filtros(colores).map((item) => (
          <ChipCategoria
            key={item.id}
            etiqueta={item.etiqueta}
            activo={filtro === item.id}
            onPress={() => setFiltro(item.id)}
            colorPunto={item.colorPunto}
          />
        ))}
      </View>

      {filtro === "perdidos" ? (
        <EstadoVacio titulo="Esta sección llega pronto a Comunidad." />
      ) : isLoading ? (
        <EsqueletoListaAvisos cantidad={3} />
      ) : isError ? (
        <EstadoError onReintentar={() => refetch()} />
      ) : avisosFiltrados.length > 0 ? (
        <>
          {fijadas.length > 0 ? (
            <View style={styles.grupo}>
              <View style={styles.encabezadoFijado}>
                <Ionicons name="alert-circle" size={14} color={colores.error} />
                <Text style={styles.tituloFijado}>Alertas activas</Text>
              </View>
              {fijadas.map((aviso) => (
                <TarjetaAviso key={aviso.id} aviso={aviso} />
              ))}
            </View>
          ) : null}

          {grupos.map((grupo) => (
            <View key={grupo.etiqueta} style={styles.grupo}>
              <Text style={styles.tituloGrupo}>{grupo.etiqueta}</Text>
              {grupo.avisos.map((aviso) => (
                <TarjetaAviso key={aviso.id} aviso={aviso} />
              ))}
            </View>
          ))}
        </>
      ) : (
        <EstadoVacio titulo="No hay nada por aquí todavía." />
      )}
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores, oscuro: boolean) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.superficieHundida,
    },
    contenido: {
      padding: espaciado.lg,
      gap: espaciado.md,
    },
    filaTitulo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: espaciado.sm,
    },
    titulo: {
      ...tipografia.displayGrande,
      color: colores.texto,
    },
    insigniaZona: {
      backgroundColor: colores.primarioSuave,
      paddingHorizontal: espaciado.sm,
      paddingVertical: 5,
      borderRadius: radios.completo,
    },
    insigniaZonaTexto: {
      ...tipografia.etiqueta,
      color: colores.primarioFuerte,
    },
    subtitulo: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
    },
    filaChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
    },
    grupo: {
      gap: espaciado.sm,
    },
    tituloGrupo: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
    },
    encabezadoFijado: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: oscuro ? "#3a201c" : "#fbe2de",
      alignSelf: "flex-start",
      paddingHorizontal: espaciado.sm,
      paddingVertical: 4,
      borderRadius: radios.completo,
    },
    tituloFijado: {
      ...tipografia.etiqueta,
      color: colores.error,
    },
  });
}
