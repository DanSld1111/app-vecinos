import { useLocalSearchParams } from "expo-router";
import { GuiaListado } from "../../../src/componentes/GuiaListado";
import { useServiciosApp } from "../../../src/datos/hooks/useServiciosApp";
import { PantallaTurismo } from "../../../src/componentes/fichasRubro/PantallaTurismo";

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
  const { slug, vista } = useLocalSearchParams<{ slug: string; vista?: string }>();
  const { data: servicios } = useServiciosApp();
  const servicio = servicios?.find((s) => s.slug === slug);

  // Turismo abre con las salidas de todas las agencias; "Ver agencias" vuelve al listado (0096).
  if (slug === "turismo" && vista !== "agencias") {
    return <PantallaTurismo titulo={servicio?.nombre ?? "Turismo"} listado={<Listado slug={slug} nombre={servicio?.nombre} descripcion={servicio?.descripcion} />} />;
  }
  return <Listado slug={slug} nombre={servicio?.nombre} descripcion={servicio?.descripcion} />;
}

function Listado({ slug, nombre, descripcion }: { slug: string; nombre?: string; descripcion?: string }) {
  return (
    <GuiaListado
      servicioSlugFijo={slug}
      mostrarFiltroCategorias
      titulo={nombre ?? ""}
      subtitulo={SUBTITULO[slug] ?? descripcion ?? ""}
      placeholderBusqueda={BUSQUEDA[slug] ?? "Buscar…"}
    />
  );
}
