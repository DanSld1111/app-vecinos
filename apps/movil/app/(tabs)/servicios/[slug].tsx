import { useLocalSearchParams } from "expo-router";
import { GuiaListado } from "../../../src/componentes/GuiaListado";
import { useServiciosApp } from "../../../src/datos/hooks/useServiciosApp";

/** Bajada de cada servicio sin pantalla propia; si no está aquí, se usa la descripción del panel. */
const SUBTITULO: Record<string, string> = {
  turismo: "Tours, paseos y agencias de viaje de tu zona",
  inmobiliaria: "Departamentos y casas en alquiler o venta",
  "rescate-animal": "Albergues, adopciones y rescatistas cerca de ti",
};

const BUSQUEDA: Record<string, string> = {
  turismo: "Buscar tour o agencia…",
  inmobiliaria: "Buscar inmobiliaria…",
  "rescate-animal": "Buscar albergue o rescatista…",
};

/**
 * Pantalla de cualquier servicio que no tiene una propia (Turismo, Inmobiliaria, Rescate animal…):
 * el mismo listado de Restaurantes o Market Space, acotado a ese servicio. Así activar un servicio
 * desde el panel no necesita una pantalla nueva. Ver docs/decisiones/0089.
 */
export default function ServicioGenerico() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: servicios } = useServiciosApp();
  const servicio = servicios?.find((s) => s.slug === slug);

  return (
    <GuiaListado
      servicioSlugFijo={slug}
      mostrarFiltroCategorias
      titulo={servicio?.nombre ?? ""}
      subtitulo={SUBTITULO[slug] ?? servicio?.descripcion ?? ""}
      placeholderBusqueda={BUSQUEDA[slug] ?? "Buscar…"}
    />
  );
}
